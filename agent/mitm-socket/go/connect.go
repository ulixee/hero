package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"os"
	"time"

	"golang.org/x/net/http2"

	utls "github.com/refraction-networking/utls"
)

const CertsMode = "certs"

func main() {
	var sessionArgs = SessionArgs{}
	var certConfig *CertConfig
	json.Unmarshal([]byte(os.Args[1]), &sessionArgs)

	signals := RegisterSignals()

	if sessionArgs.Debug {
		fmt.Printf("SessionArgs %#v\n", sessionArgs)
	}

	conn, err := ConnectIpc(sessionArgs.IpcSocketPath)
	if err != nil {
		log.Fatalf("Listening to Ipc DomainSocket Error: %+v\n", err)
	}
	defer conn.Close()

	if sessionArgs.Mode == CertsMode {
		certConfig, err = NewCertConfig(nil, nil)
		if err != nil {
			log.Fatalf("Initializing Cert Config Error: %+v\n", err)
		}

		SendToIpc(0, "init", map[string]interface{}{
			"privateKey": certConfig.privateKeyPEM,
		})
	}

	var msg []byte
	reader := bufio.NewReader(conn)

	for {
		if signals.IsClosed {
			return
		}
		conn.SetReadDeadline(time.Now().Add(100 * time.Millisecond)) // Set the deadline

		msg, err = reader.ReadBytes('\n')
		if err != nil {
			time.Sleep(50 * time.Millisecond)
			continue
		}
		var connectArgs = ConnectArgs{}
		json.Unmarshal(msg, &connectArgs)

		if sessionArgs.Mode == CertsMode {
			go generateCert(certConfig, connectArgs.Id, connectArgs.Host)
		} else {
			go handleSocket(connectArgs, sessionArgs, signals)
		}
	}
}

func generateCert(config *CertConfig, id int, hostname string) {
	cert, expireDate, err := config.CreateCert(hostname)

	if err != nil {
		SendErrorToIpc(id, "ipcConnect", err)
		return
	}

	SendToIpc(id, "certs", map[string]interface{}{
		"cert":       string(cert),
		"expireDate": expireDate,
	})
}

func handleSocket(connectArgs ConnectArgs, sessionArgs SessionArgs, signals *Signals) {
	var uTlsConn *utls.UConn
	var protocol string
	var applicationSettings []byte
	var alpsFrames AlpsFrames

	id := connectArgs.Id
	if sessionArgs.Debug {
		fmt.Printf("[id=%d] Serving at socket path %+s. ConnectArgs %#v\n", id, connectArgs.SocketPath, connectArgs)
	}

	domainConn, connErr := DialOnDomain(connectArgs.SocketPath)
	if connErr != nil {
		SendErrorToIpc(id, "ipcConnect", connErr)
		return
	}
	defer domainConn.Close()

	domainSocketPiper := &DomainSocketPiper{
		client:  domainConn,
		id:      connectArgs.Id,
		debug:   sessionArgs.DebugData,
		signals: signals,
	}
	defer domainSocketPiper.Close()

	addr := fmt.Sprintf("%s:%s", connectArgs.Host, connectArgs.Port)
	dialConn, connectErr := Dial(addr, connectArgs, sessionArgs)

	if connectErr != nil {
		SendErrorToIpc(id, "dial", connectErr)
		return
	}
	defer dialConn.Close()

	if connectArgs.IsSsl {
		var err error
		uTlsConn, err = EmulateTls(dialConn, addr, sessionArgs, connectArgs)
		if err != nil {
			SendErrorToIpc(id, "emulateTls", err)
			return
		}
		protocol = uTlsConn.ConnectionState().NegotiatedProtocol
		applicationSettings = uTlsConn.ConnectionState().PeerApplicationSettings
		if applicationSettings != nil {
			buf := new(bytes.Buffer)
			alps := bytes.NewBuffer(applicationSettings)
			framer := http2.NewFramer(buf, alps)
			framer.AllowIllegalReads = true
			alpsFrames = AlpsFrames{}

			for {
				frame, err := framer.ReadFrame()
				if frame == nil || err != nil {
					break
				}
				if unknown, ok := frame.(*http2.UnknownFrame); ok == true {
					header := frame.Header()
					if uint8(header.Type) == AcceptChFrameType {
						alpsFrames.AcceptChPayload = unknown.Payload()
					}
				}
				if settings, ok := frame.(*http2.SettingsFrame); ok == true {
					alpsFrames.Settings = []http2.Setting{}
					for i := 0; i < settings.NumSettings(); i++ {
						alpsFrames.Settings = append(alpsFrames.Settings, settings.Setting(i))
					}
				}

			}
		}
		tcpConn, ok := dialConn.(*net.TCPConn)
		if protocol == "h2" && ok {
			tcpConn.SetNoDelay(true)
		}
	}

	SendToIpc(id, "connected", map[string]interface{}{
		"alpn":                   protocol,
		"rawApplicationSettings": applicationSettings,
		"alps":                   alpsFrames,
		"remoteAddress":          dialConn.RemoteAddr().String(),
		"localAddress":           dialConn.LocalAddr().String(),
	})

	if uTlsConn != nil {
		domainSocketPiper.Pipe(uTlsConn)
	} else {
		domainSocketPiper.Pipe(dialConn)
	}
}

var AcceptChFrameType uint8 = 0x89

type AlpsFrames struct {
	AcceptChPayload []byte
	Settings        []http2.Setting
}

type ConnectArgs struct {
	Id                  int
	SocketPath          string
	Host                string
	Port                string
	IsSsl               bool
	Servername          string
	ProxyUrl            string
	KeepAlive           bool
	IsWebsocket         bool
	KeylogPath          string
	ApplicationSettings map[string]string
}

type SessionArgs struct {
	IpcSocketPath      string
	RejectUnauthorized bool
	UserAgent           string
	ClientHelloId      string
	TcpTtl             int
	TcpWindowSize      int
	Debug              bool
	DebugData          bool
	Mode               string
}

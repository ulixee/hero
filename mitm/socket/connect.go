package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	utls "github.com/ulixee/utls"
)

func main() {
	var socketPath = os.Args[1]
	var connectArgs = ConnectArgs{}
	var uTlsConn *utls.UConn

	// also make a signals channel
	sigc := make(chan os.Signal, 1)
	signal.Notify(sigc, os.Interrupt, os.Kill, syscall.SIGINT, syscall.SIGTERM)

    go func() {
		_, err := fmt.Scanf("disconnect")
		if err != nil {
			panic(err)
		}
		sigc <- syscall.SIGINT
	}()


	json.Unmarshal([]byte(os.Args[2]), &connectArgs)

	debug := connectArgs.Debug


	domainSocketPiper := &DomainSocketPiper{
		Path:  socketPath,
		debug: connectArgs.Debug,
	}

	if debug {
		fmt.Printf("Serving at socket path %+s. ConnectArgs %#v\n", socketPath, connectArgs)
	}

	domainSocketPiper.Listen()

	addr := fmt.Sprintf("%s:%s", connectArgs.Host, connectArgs.Port)
	dialConn, err := Dial(addr, connectArgs)

	if err != nil {
		log.Fatalf("Dial (proxy/remote) Error: %+v\n", err)
	}

	fmt.Printf("[DomainSocketPiper.Dialed] Remote: %s, Local: %s\n", dialConn.RemoteAddr(), dialConn.LocalAddr())

	defer dialConn.Close()

	if connectArgs.IsSsl {
		uTlsConn = EmulateTls(dialConn, addr, connectArgs)
		if debug {
			fmt.Printf("SSL Connected %s\n", addr)
		}
	}

	fmt.Println("[DomainSocketPiper.ReadyForConnect]")
	domainSocketPiper.WaitForClient()

	var protocol string
	if uTlsConn != nil {
		protocol = uTlsConn.ConnectionState().NegotiatedProtocol
	}
	// print message for listening creator to handle
	fmt.Printf("[DomainSocketPiper.Connected] ALPN: %s\n", protocol)

	if uTlsConn != nil {
		domainSocketPiper.Pipe(uTlsConn, sigc)
	} else {
		domainSocketPiper.Pipe(dialConn, sigc)
	}
}

type ConnectArgs struct {
	Host               string
	Port               string
	IsSsl              bool
	Servername         string
	RejectUnauthorized bool
	ProxyUrl           string
	ProxyAuthBase64    string
	ClientHelloId      string
	TcpTtl             int
	TcpWindowSize      int
	Debug              bool
}

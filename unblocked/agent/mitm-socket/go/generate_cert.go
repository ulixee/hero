package main

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha1"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"errors"
	"fmt"
	"log"
	"math/big"
	"net"
	"os"
	"sync/atomic"
	"time"
)

/// Reference/Credit: https://github.com/AdguardTeam/gomitmproxy

// While generating a new certificate, in order to get a unique serial
// number every time we increment this value.
var currentSerialNumber int64 = time.Now().Unix()

// Config is a set of configuration values that are used to build TLS configs
// capable of MITM.
type CertConfig struct {
	ca           *x509.Certificate // Root certificate authority
	caPrivateKey *rsa.PrivateKey   // CA private key

	// privateKey is the private key that will be used to generate leaf certificates
	publicKey     crypto.PublicKey
	privateKeyPEM string

	keyID        []byte // SKI to use in generated certificates (https://tools.ietf.org/html/rfc3280#section-4.2.1.2)
	organization string // Organization (will be used for generated certificates)
}

func readCertFromDisk(file string) (*x509.Certificate, error) {

	bytes, err := os.ReadFile(file)

	if err != nil {
		return nil, err
	}

	cert, err := x509.ParseCertificate(bytes)
	if err != nil {
		return nil, err
	}
	return cert, nil
}

func readPrivateKeyFromDisk(file string) (*rsa.PrivateKey, error) {

	bytes, err := os.ReadFile(file)
	if err != nil {
		return nil, err
	}

	key, err := x509.ParsePKCS8PrivateKey(bytes)
	if err != nil {
		return nil, err
	}

	privatePkcs8RsaKey, ok := key.(*rsa.PrivateKey)
	if !ok {
		return nil, fmt.Errorf("Pkcs8 contained non-RSA key. Expected RSA key.")
	}
	return privatePkcs8RsaKey, nil
}

// NewAuthority creates a new CA certificate and associated private key.
func NewAuthority() (*x509.Certificate, *rsa.PrivateKey, error) {
	var caFile string = "ca.der"
	var caKeyFile string = "caKey.der"

	certFromDisk, err := readCertFromDisk(caFile)

	if err != nil && !errors.Is(err, os.ErrNotExist) {
		log.Printf("Error reading cert from disk", caFile, err)
	} else if err == nil {
		keyFromDisk, err := readPrivateKeyFromDisk(caKeyFile)
		if err != nil {
			log.Printf("Error reading private key from disk", caKeyFile, err)
		} else {
			return certFromDisk, keyFromDisk, nil
		}
	}

	// Generating the private key that will be used for domain certificates
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return nil, nil, err
	}
	pub := priv.Public()

	// Subject Key Identifier support for end entity certificate.
	// https://tools.ietf.org/html/rfc3280#section-4.2.1.2
	pkixpub, err := x509.MarshalPKIXPublicKey(pub)
	if err != nil {
		return nil, nil, err
	}
	h := sha1.New()
	_, err = h.Write(pkixpub)
	if err != nil {
		return nil, nil, err
	}
	keyID := h.Sum(nil)

	// Increment the serial number
	serial := atomic.AddInt64(&currentSerialNumber, 1)

	tmpl := &x509.Certificate{
		SerialNumber: big.NewInt(serial),
		Subject: pkix.Name{
			CommonName:   "Unblocked",
			Organization: []string{"Unblocked"},
		},
		SubjectKeyId:          keyID,
		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature | x509.KeyUsageCertSign,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
		NotBefore:             time.Now().AddDate(-1, 0, 0),
		NotAfter:              time.Now().AddDate(1, 0, 0),
		DNSNames:              []string{"Unblocked"},
		IsCA:                  true,
	}

	raw, err := x509.CreateCertificate(rand.Reader, tmpl, tmpl, pub, priv)
	if err != nil {
		return nil, nil, err
	}

	err = os.WriteFile(caFile, raw, 0600)
	if err != nil {
		return nil, nil, err
	}

	privBytes, err := x509.MarshalPKCS8PrivateKey(priv)
	if err != nil {
		return nil, nil, err
	}
	err = os.WriteFile(caKeyFile, privBytes, 0600)
	if err != nil {
		return nil, nil, err
	}

	// Parse certificate bytes so that we have a leaf certificate.
	x509c, err := x509.ParseCertificate(raw)
	if err != nil {
		return nil, nil, err
	}

	return x509c, priv, nil
}

func NewCertConfig(ca *x509.Certificate, caPrivateKey *rsa.PrivateKey) (*CertConfig, error) {

	var priv *rsa.PrivateKey

	if ca == nil {
		var err error
		ca, caPrivateKey, err = NewAuthority()

		if err != nil {
			return nil, err
		}

		priv, _ = readPrivateKeyFromDisk("privKey.der")
	}

	var needsSave bool = false
	if priv == nil {
		var err error
		// Generating the private key that will be used for domain certificates
		priv, err = rsa.GenerateKey(rand.Reader, 2048)
		if err != nil {
			return nil, err
		}
		needsSave = true
	}
	privBytes, err := x509.MarshalPKCS8PrivateKey(priv)
	if err != nil {
		return nil, err
	}

	if needsSave {
		err = os.WriteFile("privKey.der", privBytes, 0600)
		if err != nil {
			return nil, err
		}
	}
	pub := priv.Public()

	// Subject Key Identifier support for end entity certificate.
	// https://tools.ietf.org/html/rfc3280#section-4.2.1.2
	pkixpub, err := x509.MarshalPKIXPublicKey(pub)
	if err != nil {
		return nil, err
	}
	h := sha1.New()
	_, err = h.Write(pkixpub)
	if err != nil {
		return nil, err
	}
	keyID := h.Sum(nil)

	privateKeyPEM := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: privBytes})

	return &CertConfig{
		ca:            ca,
		caPrivateKey:  caPrivateKey,
		publicKey:     pub,
		privateKeyPEM: string(privateKeyPEM),
		keyID:         keyID,
		organization:  "Unblocked",
	}, nil
}

func (c *CertConfig) CreateCert(hostname string) ([]byte, int64, error) {

	// Increment the serial number
	serial := atomic.AddInt64(&currentSerialNumber, 1)
	expireDate := time.Now().AddDate(0, 1, 0)

	tmpl := &x509.Certificate{
		SerialNumber: big.NewInt(serial),
		Subject: pkix.Name{
			CommonName:   hostname,
			Organization: []string{c.organization},
		},
		SubjectKeyId:          c.keyID,
		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
		NotBefore:             time.Now().AddDate(0, 0, -1),
		NotAfter:              expireDate,
	}

	if ip := net.ParseIP(hostname); ip != nil {
		tmpl.IPAddresses = []net.IP{ip}
	} else {
		tmpl.DNSNames = []string{hostname}
	}

	derBytes, err := x509.CreateCertificate(rand.Reader, tmpl, c.ca, c.publicKey, c.caPrivateKey)
	if err != nil {
		return nil, 0, err
	}

	certPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: derBytes})

	return certPEM, expireDate.Unix(), nil
}

package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"
)

type Signals struct {
	sigc     chan os.Signal
	IsClosed bool
}

func RegisterSignals() *Signals {
	sigc := make(chan os.Signal, 1)
	signals := &Signals{
		IsClosed: false,
		sigc:     sigc,
	}

	signal.Notify(sigc, os.Interrupt, os.Kill, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		_, err := fmt.Scanf("disconnect")
		if err != nil {
			panic(err)
		}
		sigc <- syscall.SIGINT
	}()

	go func(sigs *Signals) {
		<-sigc
		sigs.IsClosed = true
	}(signals)

	return signals
}

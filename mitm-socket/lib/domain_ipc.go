package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
)

var conn net.Conn
var encoder *json.Encoder

func ConnectIpc(path string) (net.Conn, error) {
	var err error
	conn, err = DialOnDomain(path)
	if err != nil {
		return nil, err
	}
	encoder = json.NewEncoder(conn)

	return conn, nil
}

func SendToIpc(id int, status string, extras map[string]interface{}) {
	msg := map[string]interface{}{
		"id":     id,
		"status": status,
	}

	if extras != nil {
		for k := range extras {
			msg[k] = extras[k]
		}
	}

	err := encoder.Encode(&msg)
	if err != nil {
		log.Fatalf("[id=%d] WriteMessage Error: %+v\n", id, err)
	}
}

func SendErrorToIpc(id int, step string, err error) {
	msg := map[string]interface{}{
		"id":         id,
		"status":     "error",
		"error-step": step,
		"error":      fmt.Sprintf("%+v", err),
	}
	writeError := encoder.Encode(&msg)

	if writeError != nil {
		log.Fatalf("[id=%d] WriteMessage Error: %+v\n", id, writeError)
	}
}

type ErrorIpcMessage struct {
	Id        int    `id`
	Status    string `status`
	Error     string `error`
	ErrorStep string `errorStep`
}

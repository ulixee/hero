// +build windows

package main

import "syscall"

func ConfigureTcpTtl(fd uintptr, ttl int) error {
	return syscall.SetsockoptInt(syscall.Handle(fd), syscall.IPPROTO_IP, syscall.IP_TTL, ttl)
}

func ConfigureTcpWindowSize(fd uintptr, windowSize int) error {
	return syscall.SetsockoptInt(syscall.Handle(fd), syscall.SOL_SOCKET, syscall.SO_RCVBUF, windowSize)
}

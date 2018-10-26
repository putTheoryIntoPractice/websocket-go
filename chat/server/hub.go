package server

import (
	"encoding/json"
)

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients.
	clients map[string]map[*Client]bool

	// Inbound messages from the clients.
	broadcast chan *Package

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan *Package),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[string]map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			channel := client.channel
			h.clients[channel][client] = true
			pkg := NewPackage(channel, NewAddUsersMsg(client.username))
			h.broacastOthers(pkg, client)

			pkg2 := NewPackage(channel, NewGetUsersMsg(h.getAllUser(channel)))
			h.sendByUserName(pkg2, client.username)
		case client := <-h.unregister:
			if _, ok := h.clients[client.channel][client]; ok {
				delete(h.clients[client.channel], client)
				close(client.send)
				h.broacastAll(NewPackage(client.channel, NewLeaveUsersMsg(client.username)))
			}
		case pkg := <-h.broadcast:
			if pkg.Message.(ChatMsg).Target == "*"{
				h.broacastAll(pkg)
			} else {
				h.sendByUserName(pkg, pkg.Message.(ChatMsg).Target)
			}
		}
	}
}

func (h *Hub) getAllUser(channel string) (users []string) {
	users = make([]string, 0, 10)
	for client := range h.clients[channel] {
		users = append(users, client.username)
	}
	return
}

func (h *Hub) sendByUserName(pkg *Package, userName string) {
	for c := range h.clients[pkg.Channel] {
		if c.username == userName {
			data, _ := json.Marshal(pkg.Message)
			select {
			case c.send <- data:
			default:
				close(c.send)
				delete(h.clients[c.channel], c)
			}
		}
	}
}

func (h *Hub) broacastAll(pkg *Package) {
	for client := range h.clients[pkg.Channel] {
		data, _ := json.Marshal(pkg.Message)
		select {
		case client.send <- data:
		default:
			close(client.send)
			delete(h.clients[client.channel], client)
		}
	}
}

func (h *Hub) broacastOthers(pkg *Package, client *Client) {
	for c := range h.clients[pkg.Channel] {
		if c == client {
			continue
		}
		data, _ := json.Marshal(pkg.Message)
		select {
		case c.send <- data:
		default:
			close(c.send)
			delete(h.clients[c.channel], c)
		}
	}
}

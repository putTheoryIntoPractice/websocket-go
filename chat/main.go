package main

import (
	"flag"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"websocket-go/chat/server"
)

var addr = flag.String("addr", ":8080", "http service address")

func serveHome(c *gin.Context) {
	w := c.Writer
	r := c.Request
	log.Println(r.URL.Path)
	/*if r.URL.Path == "/" {
		http.ServeFile(w, r, "chat/public/index.html")
	} else {
	}*/
	http.ServeFile(w, r, "chat/public" + r.URL.Path)
}

func main() {
	flag.Parse()
	hub := server.NewHub()
	go hub.Run()

	r := gin.Default()

	r.GET("/", func(c *gin.Context) {
		http.ServeFile(c.Writer, c.Request, "chat/public/index.html")
	})

	r.GET("/js/:name", func(context *gin.Context) {
		http.ServeFile(context.Writer, context.Request, "chat/public" + context.Request.URL.Path)
	})

	r.GET("/ws", func(context *gin.Context) {
		server.ServeWs(hub, context.Writer, context.Request)
	})

	r.Run(*addr)
}

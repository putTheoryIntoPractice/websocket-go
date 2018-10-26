package server

type Package struct {
	Channel string       `json:"channel"`
	Message interface{} `json:"message"`
}

func NewPackage(channel string, message interface{}) *Package {
	return &Package{
		Message: message,
		Channel: channel,
	}
}

type ChatMsg struct {
	Action  string `json:"action"`
	Content string `json:"content"`
	Target string `json:"target"`
}

func NewChatMsg(content string, target string) ChatMsg{
	return ChatMsg{
		Action: "onChat",
		Content: content,
		Target: target,
	}
}

type GetUsersMsg struct {
	Action string   `json:"action"`
	Users  []string `json:"users"`
}

func NewGetUsersMsg(users []string) *GetUsersMsg {
	return &GetUsersMsg{
		Action:"onGetUsers",
		Users: users,
	}
}

type AddUsersMsg struct {
	Action string `json:"action"`
	User   string `json:"user"`
}

func NewAddUsersMsg(user string) *AddUsersMsg {
	return &AddUsersMsg{
		Action: "onAddUser",
		User: user,
	}
}

type LeaveUsersMsg struct {
	Action string `json:"action"`
	User   string `json:"user"`
}

func NewLeaveUsersMsg(user string) *AddUsersMsg {
	return &AddUsersMsg{
		Action: "onLeave",
		User: user,
	}
}


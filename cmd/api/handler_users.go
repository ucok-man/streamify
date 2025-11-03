package main

import (
	"errors"
	"fmt"
	"net/http"
	"slices"

	"github.com/go-chi/chi/v5"
	"github.com/ucok-man/streamify/cmd/api/dto"
	"github.com/ucok-man/streamify/internal/models"
	"github.com/ucok-man/streamify/internal/validator"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func (app *application) getUserById(w http.ResponseWriter, r *http.Request) {
	idparam := chi.URLParam(r, "userId")
	userID, err := bson.ObjectIDFromHex(idparam)
	if err != nil {
		app.errBadRequest(w, r, fmt.Errorf("invalid user id value"))
		return
	}

	user, err := app.models.User.GetById(userID)
	if err != nil {
		switch {
		case errors.Is(err, models.ErrRecordNotFound):
			app.errNotFound(w, r)
		default:
			app.errInternalServer(w, r, err)
		}
		return
	}

	err = app.writeJSON(w, http.StatusOK, envelope{"user": user}, nil)
	if err != nil {
		app.errInternalServer(w, r, err)
	}
}

func (app *application) recommended(w http.ResponseWriter, r *http.Request) {
	var dto dto.RecommendedUserDTO
	var err error

	dto.Page, err = app.queryInt(r.URL.Query(), "page", 1)
	if err != nil {
		app.errBadRequest(w, r, fmt.Errorf("page, %v", err))
		return
	}
	dto.PageSize, err = app.queryInt(r.URL.Query(), "page_size", 10)
	if err != nil {
		app.errBadRequest(w, r, fmt.Errorf("page_size, %v", err))
		return
	}
	dto.Query = app.queryString(r.URL.Query(), "query", "")

	errmap := validator.Schema().RecommendedUser.Validate(&dto)
	if errmap != nil {
		app.errFailedValidation(w, r, validator.Sanitize(errmap))
		return
	}

	currentUser := app.contextGetUser(r)
	users, metadata, err := app.models.User.Recommended(models.RecommendedUserParam{
		CurrentUser: currentUser,
		Page:        int64(dto.Page),
		PageSize:    int64(dto.PageSize),
		Query:       dto.Query,
	})
	if err != nil {
		app.errInternalServer(w, r, err)
		return
	}

	err = app.writeJSON(w, http.StatusOK, envelope{"users": users, "metadata": metadata}, nil)
	if err != nil {
		app.errInternalServer(w, r, err)
	}
}

func (app *application) myfriend(w http.ResponseWriter, r *http.Request) {
	var dto dto.MyFriendsDTO
	var err error

	dto.Page, err = app.queryInt(r.URL.Query(), "page", 1)
	if err != nil {
		app.errBadRequest(w, r, fmt.Errorf("page, %v", err))
		return
	}
	dto.PageSize, err = app.queryInt(r.URL.Query(), "page_size", 10)
	if err != nil {
		app.errBadRequest(w, r, fmt.Errorf("page_size, %v", err))
		return
	}
	dto.Query = app.queryString(r.URL.Query(), "query", "")

	errmap := validator.Schema().MyFriendsSchema.Validate(&dto)
	if errmap != nil {
		app.errFailedValidation(w, r, validator.Sanitize(errmap))
		return
	}

	currentUser := app.contextGetUser(r)
	users, metadata, err := app.models.User.MyFriends(models.MyFriendsParam{
		CurrentUser: currentUser,
		Query:       dto.Query,
		Page:        int64(dto.Page),
		PageSize:    int64(dto.PageSize),
	})
	if err != nil {
		app.errInternalServer(w, r, err)
		return
	}

	err = app.writeJSON(w, http.StatusOK, envelope{"users": users, "metadata": metadata}, nil)
	if err != nil {
		app.errInternalServer(w, r, err)
	}
}

func (app *application) requestFriend(w http.ResponseWriter, r *http.Request) {
	idparam := chi.URLParam(r, "recipientId")
	recipientId, err := bson.ObjectIDFromHex(idparam)
	if err != nil {
		app.errBadRequest(w, r, fmt.Errorf("invalid recipient id value"))
		return
	}

	currentUser := app.contextGetUser(r)

	recipient, err := app.models.User.GetById(recipientId)
	if err != nil {
		app.errBadRequest(w, r, fmt.Errorf("invalid recipient id value"))
		return
	}

	alreadyFriend := slices.Contains(currentUser.FriendIDs, recipient.ID)
	if alreadyFriend {
		app.errBadRequest(w, r, fmt.Errorf(`already friend with user %v`, idparam))
		return
	}

	exist, err := app.models.FriendRequest.CheckExisting(currentUser.ID, recipient.ID)
	if err != nil {
		app.errInternalServer(w, r, err)
		return
	}
	if exist {
		app.errBadRequest(w, r, fmt.Errorf(`friend request already exist between you and this user`))
		return
	}

	friendRequest := &models.FriendRequest{
		SenderID:    currentUser.ID,
		RecipientID: recipient.ID,
		Status:      models.FriendRequestStatusPending,
	}

	friendRequest, err = app.models.FriendRequest.Create(friendRequest)
	if err != nil {
		app.errInternalServer(w, r, err)
		return
	}

	err = app.writeJSON(w, http.StatusCreated, envelope{"friend_request": friendRequest}, nil)
	if err != nil {
		app.errInternalServer(w, r, err)
	}
}

func (app *application) acceptFriend(w http.ResponseWriter, r *http.Request) {
	idparam := chi.URLParam(r, "friendRequestId")
	friendRequestId, err := bson.ObjectIDFromHex(idparam)
	if err != nil {
		app.errBadRequest(w, r, fmt.Errorf("invalid friend request id value"))
		return
	}

	currentUser := app.contextGetUser(r)

	friendRequest, err := app.models.FriendRequest.GetById(friendRequestId)
	if err != nil {
		switch {
		case errors.Is(err, models.ErrRecordNotFound):
			app.errNotFound(w, r)
		default:
			app.errInternalServer(w, r, err)
		}
		return
	}

	if friendRequest.RecipientID.Hex() != currentUser.ID.Hex() {
		app.errNotPermitted(w, r)
		return
	}

	friendRequest.Status = models.FriendRequestStatusAccepted

	friendRequest, err = app.models.FriendRequest.Update(friendRequest)
	if err != nil {
		app.errInternalServer(w, r, err)
		return
	}

	if err := app.models.User.AddFriends(friendRequest.RecipientID, friendRequest.SenderID); err != nil {
		app.errInternalServer(w, r, err)
		return
	}

	if err := app.models.User.AddFriends(friendRequest.SenderID, friendRequest.RecipientID); err != nil {
		app.errInternalServer(w, r, err)
		return
	}

	err = app.writeJSON(w, http.StatusOK, envelope{"friend_request": friendRequest}, nil)
	if err != nil {
		app.errInternalServer(w, r, err)
	}
}

func (app *application) getAllFromFriendRequest(w http.ResponseWriter, r *http.Request) {
	var dto dto.GetAllFromFriendRequestDTO
	var err error

	dto.Page, err = app.queryInt(r.URL.Query(), "page", 1)
	if err != nil {
		app.errBadRequest(w, r, fmt.Errorf("page, %v", err))
		return
	}
	dto.PageSize, err = app.queryInt(r.URL.Query(), "page_size", 10)
	if err != nil {
		app.errBadRequest(w, r, fmt.Errorf("page_size, %v", err))
		return
	}
	dto.SearchSender = app.queryString(r.URL.Query(), "search_sender", "")
	dto.Status = app.queryString(r.URL.Query(), "status", "All")

	errmap := validator.Schema().GetAllFromFriendRequest.Validate(&dto)
	if errmap != nil {
		app.errFailedValidation(w, r, validator.Sanitize(errmap))
		return
	}

	currentUser := app.contextGetUser(r)
	friendRequests, metadata, err := app.models.FriendRequest.GetAllFromFriendRequest(models.GetAllFromFriendRequestParam{
		CurrentUserId: currentUser.ID,
		Status:        dto.Status,
		Page:          int64(dto.Page),
		PageSize:      int64(dto.PageSize),
		SearchSender:  dto.SearchSender,
	})
	if err != nil {
		app.errInternalServer(w, r, err)
		return
	}

	err = app.writeJSON(w, http.StatusOK, envelope{"friend_requests": friendRequests, "metadata": metadata}, nil)
	if err != nil {
		app.errInternalServer(w, r, err)
	}
}

func (app *application) getAllSendFriendRequest(w http.ResponseWriter, r *http.Request) {
	var dto dto.GetAllSendFriendRequestDTO
	var err error

	dto.Page, err = app.queryInt(r.URL.Query(), "page", 1)
	if err != nil {
		app.errBadRequest(w, r, fmt.Errorf("page, %v", err))
		return
	}
	dto.PageSize, err = app.queryInt(r.URL.Query(), "page_size", 10)
	if err != nil {
		app.errBadRequest(w, r, fmt.Errorf("page_size, %v", err))
		return
	}
	dto.SearchRecipient = app.queryString(r.URL.Query(), "search_recipient", "")
	dto.Status = app.queryString(r.URL.Query(), "status", "All")

	errmap := validator.Schema().GetAllSendFriendRequest.Validate(&dto)
	if errmap != nil {
		app.errFailedValidation(w, r, validator.Sanitize(errmap))
		return
	}

	currentUser := app.contextGetUser(r)
	friendRequests, metadata, err := app.models.FriendRequest.GetAllSendFriendRequest(models.GetAllSendFriendRequestParam{
		CurrentUserId:   currentUser.ID,
		Status:          dto.Status,
		Page:            int64(dto.Page),
		PageSize:        int64(dto.PageSize),
		SearchRecipient: dto.SearchRecipient,
	})
	if err != nil {
		app.errInternalServer(w, r, err)
		return
	}

	err = app.writeJSON(w, http.StatusOK, envelope{"friend_requests": friendRequests, "metadata": metadata}, nil)
	if err != nil {
		app.errInternalServer(w, r, err)
	}
}

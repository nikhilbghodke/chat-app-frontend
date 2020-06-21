import {
    NEW_MESSAGE,
    CHANGE_CONVERSATION,
    INIT_CHANNELS,
    CHAT_LOADING_DONE,
    INIT_USERS_CONVO,
    DIRECTS_LOADING_DONE,
    INIT_ROOM,
    MEMBERS,
    REPORT_MESSAGE,
    GET_SOME_CHANNEL_MESSAGES,
    PARTIAL_LOADING_STARTED,
    PARTIAL_LOADING_DONE
} from '../actionTypes';
import { serverBaseURL, apiCall, setTokenHeader } from '../../services/api'
import { addError, removeError } from "./error";
import axios from 'axios'

export function addNewMessage(message, typeOfConversation, conversationName) {
    return {
        type: NEW_MESSAGE,
        message,
        typeOfConversation,
        conversationName
    }
}

export function changeCoversation(typeOfCoversation, indexOfConversation) {
    return {
        type: CHANGE_CONVERSATION,
        typeOfCoversation,
        indexOfConversation
    }
}

export function initChannel(channels) {
    return {
        type: INIT_CHANNELS,
        channels
    }
}

export function initUserConvo(userConversations) {
    return {
        type: INIT_USERS_CONVO,
        userConversations
    }
}

export function chatLoadingCompleted() {
    return {
        type: CHAT_LOADING_DONE
    }
}

export function directMessagesLoadingCompleted() {
    return {
        type: DIRECTS_LOADING_DONE
    }
}

export function initRoom(roomName) {
    return {
        type: INIT_ROOM,
        roomName
    }
}

export function roomMembers(members) {
    return {
        type: MEMBERS,
        members
    }
}

export function reportedMessage(id, convoType, convoName) {
    console.log("REPORTED MESSAGE AFTER API")
    return {
        type: REPORT_MESSAGE,
        id,
        convoType,
        convoName
    }
}

export function setSomeChannelMessages(channelName, newMessages) {
    return {
        type: GET_SOME_CHANNEL_MESSAGES,
        channelName,
        newMessages
    }
}

export function partialLoadingStart() {
    return {
        type: PARTIAL_LOADING_STARTED
    }
}

export function partialLoadingDone() {
    return {
        type: PARTIAL_LOADING_DONE
    }
}

/* *************************** */


export function setAuthorizationToken(token) {
    setTokenHeader(token);
}

// API functions:

export function getAllChannelMessages(roomName, numberOfMessages) {
    return dispatch => {
        return new Promise(async (resolve, reject) => {
            try {
                const channels = await apiCall("GET", serverBaseURL + `/allMessages/${roomName}/?limit=${numberOfMessages}&skip=0`);
                console.log(channels);
                let listOfChannels = [];
                for (var channel in channels) {
                    let channelObject = {
                        name: channel,
                        messages: channels[channel].messages,
                        description: channels[channel].description
                    };
                    listOfChannels.push(channelObject);
                }
                dispatch(initChannel(listOfChannels));
                dispatch(chatLoadingCompleted());
                resolve();
            }
            catch (error) {
                dispatch(addError(error.message));
                reject();
            }
        })
    }
}

export function getSomeChannelMessages(messageData) {
    let { roomName, channelName, limit, skip } = messageData
    return dispatch => {
        return new Promise(async (resolve, reject) => {
            try {
                dispatch(partialLoadingStart())
                const messages = await apiCall("GET", serverBaseURL + `/allMessages/${roomName}/${channelName}?limit=${limit}&skip=${skip}`);
                console.log(messages);
                dispatch(setSomeChannelMessages(channelName, messages))
                dispatch(partialLoadingDone())
                resolve();
            }
            catch (error) {
                dispatch(addError(error.message));
                reject();
            }
        })
    }
}

export function getAllDirectMessages(roomName) {
    return dispatch => {
        return new Promise(async (resolve, reject) => {
            try {
                const userConversations = await apiCall("GET", serverBaseURL + `/allDirectMessages/${roomName}`);
                console.log(userConversations);
                let listOfUsers = [];
                for (var user in userConversations) {
                    let userObject = {
                        name: user,
                        messages: userConversations[user]
                    };
                    listOfUsers.push(userObject);
                }
                dispatch(initUserConvo(listOfUsers));
                dispatch(directMessagesLoadingCompleted());
                resolve();
            }
            catch (error) {
                dispatch(addError(error.message));
                reject();
            }
        })
    }
}

export function uploadFile(file, fileName, callback) {
    let formData = new FormData();
    formData.append('avatar', file, fileName)
    return dispatch => {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await apiCall("POST", serverBaseURL + `/upload`, formData);
                callback(response.address);
                resolve();
            }
            catch (error) {
                dispatch(addError(error.message));
                reject();
            }
        })
    }
}

export function downloadFile(fileAddress, callback) {
    const token = localStorage.jwtToken
    const data = { address: fileAddress }
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }
    return dispatch => {
        return new Promise(async (resolve, reject) => {
            try {
                const file = await axios.post(serverBaseURL + '/download', data, {
                    headers: headers
                })
                callback(file);
                resolve();
            }
            catch (error) {

                dispatch(addError(error.message));
                reject();
            }
        })
    }
}

export function getMembers(roomName) {
    return dispatch => {
        return new Promise(async (resolve, reject) => {
            try {
                const members = await apiCall("get", `${serverBaseURL}/rooms/${roomName}/members`, null);
                dispatch(roomMembers(members));
                dispatch(removeError());
                resolve();
            }
            catch (error) {
                dispatch(addError(error.message));
                reject();
            }
        })
    }
}
export function removeUser(title, name, callback) {
    console.log(name)
    console.log(title)
    return dispatch => {
        return new Promise(async (resolve, reject) => {
            try {
                await apiCall("get", `${serverBaseURL}/rooms/${title}/kick/${name}`, null);
                dispatch(removeError());
                callback();
                resolve();
            }
            catch (err) {
                console.log(err);
                dispatch(addError(err.message));
                reject();
            }
        });
    };
}

export function reportMes(mObject) {
    console.log(mObject)
    let { id, convoType, convoName, roomName } = mObject;
    return dispatch => {
        return new Promise(async (resolve, reject) => {
            try {
                await apiCall('post', `${serverBaseURL}/room/${roomName}/report/${id}`)
                // apiCall()
                console.log("REPORT API HIT")
                console.log(id, convoType, convoName)
                dispatch(reportedMessage(id, convoType, convoName))
                resolve();
            } catch (error) {
                dispatch(addError(error.message));
                reject();
            }
        })
    }
}
import React from "react";
import { Scrollbars } from "react-custom-scrollbars";
import Prism from 'prismjs';
import Dropdown from 'react-bootstrap/Dropdown'
import { ButtonGroup } from 'react-bootstrap';
import GetAppRoundedIcon from '@material-ui/icons/GetAppRounded';
import Spinner from 'react-bootstrap/Spinner'
import { connect } from 'react-redux'
import RotateLeftIcon from '@material-ui/icons/RotateLeft';

import { downloadFile, getSomeChannelMessages } from '../../../store/actions/chatActions';
import { serverBaseURL } from '../../../services/api';
import "./messageList.css"


function TextMessage(props) {
    const [hover, setHover] = React.useState(false);

    function toggleHover() {
        setHover(!hover)
    }

    const getCoords = (url) => {
        const coords = url.split("=")[1].split(",");
        return coords[1].toString() + ", " + coords[0].toString();
    };

    if (props.messageObject.type === "location") {
        getCoords(props.messageObject.content);
    }

    const DropdownElement = () => (
        <Dropdown as={ButtonGroup}>
            <Dropdown.Toggle split variant="success" id="dropdown-split-basic" size="sm" />

            <Dropdown.Menu >
                <Dropdown.Item onClick={() => { console.log("Report!"); console.log(props.messageObject.id); props.reportOnClick(props.messageObject.id) }}>Report</Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>
    )


    return (
        <div className="message" key={props.keyValue} >
            {props.messageObject.owner === props.currentUser ? (
                <div className="spacer"></div>
            ) : null}
            <div
                onMouseEnter={toggleHover}
                onMouseLeave={toggleHover}

                className={
                    "message-area" +
                    (props.messageObject.owner === props.currentUser
                        ? " current-user"
                        : " other-user") + (props.messageObject.type.includes('code') ? " code-area" : "") + (props.messageObject.type.includes('file') ? " file-area" : "")
                }
            >
                <div className="message-user" >
                    <div className="user-name">{props.messageObject.owner}</div>
                    <div className="spacer"></div>
                    {hover && !props.messageObject.isReported && props.conversationType === "channels" ? <div className="options" ><DropdownElement /></div> : null}
                </div>

                {props.messageObject.type === "text" ? (
                    <div className="message-content">{props.messageObject.content}</div>
                ) : props.messageObject.type === "location" ? (
                    <div className="location-content">
                        <a href={props.messageObject.content}>
                            {props.messageObject.content}
                        </a>
                        <img
                            src={`https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${getCoords(
                                props.messageObject.content
                            )},11,0/400x200@2x?access_token=pk.eyJ1Ijoic2F0dmlrZGFuZGFsZSIsImEiOiJja2JpMmJkdGQwYjZhMnRwamlmYmhmZDQ5In0.xEAG7PvsDEt0lM4PCUQ_NA&logo=false`}
                            alt="location"
                            className="static-map"
                        ></img>
                    </div>
                ) : props.messageObject.type.includes('code') ?
                            (
                                <div className="message-content "><pre><code className={"language-" + props.messageObject.type.split("/")[1].toLowerCase()}>{`${props.messageObject.content}`}</code></pre></div>
                            ) : (   // It is file
                                <a
                                    href={`${serverBaseURL}/${props.messageObject.content}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="message-content"
                                ><GetAppRoundedIcon />{props.messageObject.type.split("/")[1]}</a>
                            )

                }
                <div className="message-time">{props.messageObject.time}</div>
            </div>
        </div>
    );
}

class MessageList extends React.Component {
    reportOnClick = (Mid) => {
        console.log("REPORT CLICKED")
        console.log(Mid)
        this.props.reportMessageFromChat(Mid);
    }

    componentDidMount() {
        Prism.highlightAll();
        const height = this.refs.messageScrollbar.getScrollHeight();
        this.refs.messageScrollbar.scrollTop(height);
    }

    componentDidUpdate(prevProps, prevState) {
        Prism.highlightAll();
        console.log(prevProps)
        if (!this.props.isPartialLoading) {
            const height = this.refs.messageScrollbar.getScrollHeight();
            this.refs.messageScrollbar.scrollTop(height);
        }
    }

    messageToRequest = 10;

    render() {
        return (
            <Scrollbars autoHide ref="messageScrollbar">
                <div className="pagination">
                    {this.props.isPartialLoading
                        ?
                        <Spinner animation="border" variant="secondary" className="pagination-spinner" />
                        :
                        <button
                            className="pagination-button"
                            onClick={() => {
                                console.log("HEY");
                                let messageData = { 
                                    roomName: this.props.roomName, 
                                    channelName: this.props.conversationName, 
                                    limit: this.messageToRequest, 
                                    skip: this.props.messageList.length }
                                console.log(messageData)
                                this.props.getSomeChannelMessages(messageData);
                            }
                            }
                        ><RotateLeftIcon /></button>
                    }
                </div>
                {this.props.messageList.map((message, index) => {
                    let date = new Date(message.createdAt);
                    const time = date.toTimeString().split(" ")[0];
                    let messageObject = {
                        content: message.isReported ? "This message was reported" : message.content,
                        owner: "unknown",
                        type: message.isReported ? "text" : message.type,
                        time: time,
                        id: message._id,
                        isReported: message.isReported
                    };
                    if (message.owner) {
                        if (message.owner.username)
                            messageObject.owner = message.owner.username;
                        else messageObject.owner = message.owner;
                    }
                    Prism.highlightAll();
                    return (
                        <TextMessage
                            conversationType={this.props.conversationType}
                            keyValue={index}
                            messageObject={messageObject}
                            currentUser={this.props.currentUser}
                            downloadFile={this.props.downloadFile}
                            reportOnClick={this.reportOnClick}
                        />
                    );
                })}
            </Scrollbars>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        isPartialLoading: state.chatReducer.isPartialLoading,
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        downloadFile: (fileAddress, callback) => { dispatch(downloadFile(fileAddress, callback)) },
        getSomeChannelMessages: (messageData) => { dispatch(getSomeChannelMessages(messageData)) }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(MessageList);

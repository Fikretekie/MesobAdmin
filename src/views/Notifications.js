import React, { useState, useRef } from "react";

// reactstrap components
import {
  Row,
  Col,
  Card,
  CardHeader,
  CardBody,
  FormGroup,
  Form,
  Input,
  Button,
  Spinner,
} from "reactstrap";

// core components
import PanelHeader from "components/PanelHeader/PanelHeader.js";
import Helmet from "react-helmet";
import { Editor } from "@tinymce/tinymce-react";
import NotificationAlert from "react-notification-alert";
import "react-notification-alert/dist/animate.css";
import { convert } from 'html-to-text';

function htmlToPlainText(html) {
  return convert(html, {
    wordwrap: false,
    selectors: [
      { selector: 'a', options: { ignoreHref: true } },
      { selector: 'img', format: 'skip' },
    ],
  }).trim();
}

function Notifications() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sendNotificationBtnLoading, setSendNotificationBtnLoading] = useState(false);
  const editorRef = useRef(null);

  const notificationAlertRef = useRef(null);
  const notify = (place, message, type) => {
    const options = {
      place: place,
      message: (
        <div>
          <div>{message}</div>
        </div>
      ),
      type: type,
      icon: "now-ui-icons ui-1_bell-53",
      autoDismiss: 7,
    };
    notificationAlertRef.current.notificationAlert(options);
  };

  const handleEditorChange = (content, editor) => {
    setDescription(content);
  };

const handleNotificationSend = async (e) => {
  e.preventDefault();

 const plainTitle = htmlToPlainText(title);
  const plainBody = htmlToPlainText(description);

  if (!title.trim() || !plainBody) {
    notify("tr", "Please fill in Title and Body!", "danger");
    return;
  }


  if (!title.trim() || !plainBody) {
    notify("tr", "Please fill in Title and Body!", "danger");
    return;
  }

  const payload = {
    Title: plainTitle,   // ✅ was: title
    Body: plainBody,     // ✅ was: description
  };


    console.log("Sending payload:", payload);

    try {
      setSendNotificationBtnLoading(true);
      const response = await fetch(
        "https://2uys9kc217.execute-api.us-east-1.amazonaws.com/dev/notification_topic?arn=arn:aws:sns:us-east-1:807954077262:EnpointTopic",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      const responseData = await response.json().catch(() => null);
      console.log("API Response:", responseData);

    if (response.status === 200) {
  setTitle("");
  setDescription("");
  
  // ✅ Actually clear the TinyMCE editor content
  if (editorRef.current) {
    editorRef.current.setContent("");
  }
  
  setSendNotificationBtnLoading(false);
  notify("tr", "Notification sent successfully!", "success");
}
 } catch (error) {
    console.error("Error sending notification:", error);
    notify("tr", "Failed to send notification", "danger");
  } finally {
    setSendNotificationBtnLoading(false); // ✅ moved here so it resets even on error/non-200
  }
  };

  return (
    <>
      <Helmet>
        <title>Notifications - Mesob Store</title>
      </Helmet>

      <PanelHeader
        size="sm"
        content={
          <div className="header text-center">
            <h2 className="title">Notifications</h2>
          </div>
        }
      />
      <NotificationAlert ref={notificationAlertRef} />
      <div
        className="content"
        style={{
          background:
            "linear-gradient(135deg, #5b2fc4 0%, #2d1a6b 35%, #1a1035 65%, #120b26 100%)",
          minHeight: "100vh",
        }}
      >
        <Row>
          <Col md="12">
            <Card
              style={{
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: "16px",
                boxShadow: "none",
              }}
            >
              <CardHeader style={{ borderBottom: "none" }}>
                <h5 style={{ color: "#fff", margin: 0 }}>
                  Compose Notification
                </h5>
              </CardHeader>
              <CardBody>
                <Form>
                  <Row>
                    <Col className="pr-1" md="12">
                      <FormGroup>
                        <label style={{ color: "rgba(255,255,255,0.55)" }}>
                          Title
                        </label>
                        <Input
                          placeholder="Title"
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            color: "#fff",
                            borderRadius: "10px",
                          }}
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <label style={{ color: "rgba(255,255,255,0.55)" }}>
                          Body
                        </label>
                        <Editor
                          tinymceScriptSrc={`${process.env.PUBLIC_URL}/tinymce/tinymce.min.js`}
                          onInit={(evt, editor) => (editorRef.current = editor)}
                          initialValue=""
                          init={{
                            height: 300,
                            menubar: true,
                            skin: "oxide-dark",
                            content_css: "dark",
                            branding: false,
                            promotion: false,
                            plugins: [
                              "advlist autolink lists link image charmap print preview anchor",
                              "searchreplace visualblocks code fullscreen",
                              "insertdatetime media table paste code help wordcount",
                              "placeholder",
                            ],
                            toolbar:
                              "undo redo | formatselect | " +
                              "bold italic forecolor backcolor | alignleft aligncenter " +
                              "alignright alignjustify | bullist numlist outdent indent | " +
                              "link image | removeformat",
                            placeholder: "Write your message here...",
                            content_style:
                              "body { background: #0f172a; color: #e8f1ff; font-family: Helvetica, Arial, sans-serif; }",
                          }}
                          onEditorChange={handleEditorChange}
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col md="12">
                      <style>{`
                        .notif-send-btn {
                          background: linear-gradient(90deg, #a78bfa, #60a5fa) !important;
                          color: #0a0612 !important;
                          border: none !important;
                          border-radius: 20px !important;
                          font-weight: 700 !important;
                          box-shadow: none !important;
                        }
                        .notif-send-btn:hover,
                        .notif-send-btn:focus,
                        .notif-send-btn:active {
                          background: linear-gradient(90deg, #a78bfa, #60a5fa) !important;
                          color: #0a0612 !important;
                          box-shadow: none !important;
                        }
                        .notif-send-btn:disabled {
                          background: rgba(255,255,255,0.06) !important;
                          color: rgba(255,255,255,0.35) !important;
                        }
                      `}</style>
                      <Button
                        className="notif-send-btn"
                        onClick={handleNotificationSend}
                        disabled={sendNotificationBtnLoading}
                      >
                        {sendNotificationBtnLoading ? (
                          <>
                            Sending...
                            <Spinner color="primary" size="sm" className="ml-1" />
                          </>
                        ) : (
                          "Send Notification"
                        )}
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default Notifications;
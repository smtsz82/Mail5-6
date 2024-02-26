document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').onsubmit = function() {
        console.log("SFSEFSEFEFSE");
        send_mail();
        return false;
  };
  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email() {

  // Hide success message
  success_message = document.querySelector("#success_message");
  success_message.style.display = 'none';
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  // Every time we load this page we hide error message div
  document.querySelector('#error-message').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox, sent_success = false) {

  success_message = document.querySelector("#success_message");
  success_message.style.display = 'none';
  // Show the mailbox and hide other views
  clear("emails-view");
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  // If mail was sent succcesfully display success message
  if (sent_success)
  {
        success_message.innerHTML = "Email sent successfully";
        success_message.style.display = 'block';
  }
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  // Get mails for the current mailbox
  fetch(`emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
        if (emails.length == 0)
        {
            document.querySelector('#emails-view').innerHTML += "<h4>This box is empty</h4>"
            return
        }
        mail_container = document.querySelector("#emails-view");
        for(let i = 0; i < emails.length; i++)
        {
            mail = emails[i];

            mail_div = document.createElement("div");
            mail_div.className = "email";

            mail_sender = document.createElement("div");
            mail_sender.className = "email_sender";

            mail_desc = document.createElement("div");
            mail_desc.className = "email_content_inbox";

            sender = get_sender(mail.sender);

            if (mailbox == "sent")
            {
                sender = "To:" + sender;
            }

            description = `<strong>${mail.subject}</strong> ${mail.body}`;

            mail_sender.append(sender);
            mail_desc.innerHTML = description;

            mail_div.append(mail_sender, mail_desc);

            mail_container.append(mail_div);
        }
  })
}

function get_recipients(sender_mail) {
    sender = "";
    i = 0;
    while (sender_mail[i] != "@"){
        sender += sender_mail[i];
        i += 1;
    }
    return sender
}

function clear(id){
    // Removes all childs of tag with id == 'id'
    var div = document.getElementById;

    while(div.firstChild) {
        div.removeChild(div.firstChild);
    }
}

function send_mail() {
    // Get recipients, subject and body of the mail
    recipients = document.querySelector("#compose-recipients").value;
    mail_body = document.querySelector("#compose-body").value;
    subject = document.querySelector("#compose-subject").value;
    // Send data to django server
    fetch("/emails", {
        method: "POST",
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: mail_body,
        })
    })
    // Convert response to json data
    .then(response => response.json())
    // If we failed to post the data display error message to the user, otherwise redirect to "sent" and display success message
    .then(result => {
        if (result.error){
            let message = document.querySelector("#error-message");
            message.innerHTML = result.error;
            message.style.display = 'block';
        }
        else if (result.message){
            load_mailbox("sent", true);
        }
    });
}
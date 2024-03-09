document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email(""));
  document.querySelector('#compose-form').onsubmit = function() {
        send_mail();
        return false;
  };
  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email(response) {
  // Hide email view
  document.querySelector("#email-view").style.display = "none";
  // Hide success message
  success_message = document.querySelector("#success_message");
  success_message.style.display = 'none';
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  // Every time we load this page we hide error message div
  document.querySelector('#error-message').style.display = 'none';

  // Clear out composition fields
  recipient = document.querySelector('#compose-recipients');
  subject = document.querySelector('#compose-subject');
  body = document.querySelector('#compose-body');
  console.log(response)
  if (response){
        console.log(response)
        recipient.value = response.recipient;
        if (response.subject.slice(0, 4) != "Re: "){
            response.subject = `Re: ${response.subject}`;
        }
        subject.value = response.subject;
        body.value = response.pre_fill;
  }
  else{
        recipient.value = "";
        subject.value = "";
        body.value = "";
  }
}

function load_mailbox(mailbox, sent_success = false) {

  // Hide email view
  document.querySelector("#email-view").style.display = "none";
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
            if (mailbox === "inbox"){
                document.querySelector('#emails-view').innerHTML += "<h4>You have not received any mails</h4>";
            }
            else if (mailbox === "sent"){
                document.querySelector('#emails-view').innerHTML += "<h4>You have not send any mails</h4>";
            }
            else {
                document.querySelector('#emails-view').innerHTML += "<h4>You have not archived any mails</h4>";
            }
            return
        }
        mail_container = document.querySelector("#emails-view");
        for(let i = 0; i < emails.length; i++)
        {
            mail = emails[i];

            mail_div = document.createElement("div");
            mail_div.dataset.id = mail.id;
            mail_div.dataset.read = mail.read;
            mail_div.addEventListener("click", function(){
                show_mail(this.dataset.id, mailbox)
            })
            mail_div.addEventListener("mouseover", function(){
                this.style.backgroundColor = "#bababa";
            })
            mail_div.addEventListener("mouseout", function(){
                // Change mail div color based on if it was read or not
                assign_color(this, this.dataset.read)
            })
            mail_div.className = "email";

            mail_sender = document.createElement("div");
            mail_sender.className = "email_sender";

            mail_timestamp = document.createElement("div");
            mail_timestamp.className = "date";

            mail_subject = document.createElement("div");
            mail_subject.className = "email_subject";

            mail_desc = document.createElement("div");
            mail_desc.className = "email_content_inbox";

            if (mailbox == "sent")
            {
                sender = get_recipients(mail.recipients);
                sender = "To:" + sender;
            }
            else
            {
                sender = get_name(mail.sender);
                sender = "From: " + sender;
            }
            subject = "<span class='elipsed'><strong>" + mail.subject + "</strong></span>";
            mail_body = "<span class='elipsed'>" + mail.body + "</span>";

            // Assign color to mail based if it was read
            assign_color(mail_div, mail.read);

            mail_subject.innerHTML = subject;
            mail_sender.innerHTML = sender;
            mail_desc.append(mail_subject);
            mail_desc.innerHTML += mail_body;
            mail_timestamp.innerHTML = `<span class=small_text>${mail.timestamp}</span>`;

            mail_div.append(mail_sender, mail_desc, mail_timestamp);

            mail_container.append(mail_div);
        }
  })
}

function get_recipients(recipients, get_mails = false){
    recipients_str = "";
    for (let i = 0; i < recipients.length; i++){
        recipient = recipients[i];
        if (i == recipients.length - 1){
            if (!get_mails){
                recipients_str += get_name(recipient);
            }
            else {
                recipients_str += recipient;
            }
            return recipients_str;
        }
        if (get_mails){
            recipients_str += recipient + ", ";
        }
        else{
            recipients_str += get_name(recipient) + ", ";
        }
    }
}

function get_name(mail) {
    // Returns name of a person from a email ex. foo@baz.com produces foo
    name = "";
    i = 0;
    while (mail[i] != "@"){
        name += mail[i];
        i += 1;
    }
    return name
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

function show_mail(id, mailbox){
    // Hide success message
    success_message = document.querySelector("#success_message");
    success_message.style.display = 'none';
    // Mark email as read if it is accessed through inbox
    if (mailbox == "inbox") {
        mark_as_read(id);
    }
    // hide emails-view and display email-view
    document.querySelector("#emails-view").style.display = "none";
    email_div = document.querySelector("#email-view");
    email_div.style.display = "block";
    // use api to get email details
    fetch(`emails/${id}`)
    .then(response => response.json())
    .then(mail => {
        email_div.innerHTML = `<h3>${mail.subject}</h3>`;
        email_div.innerHTML += `<hr>`;

        email_description = document.createElement("div");
        email_description.className = "mail-desc";



        email_info = document.createElement("div");
        email_info.className = "email-info";
        email_info.innerHTML += `<strong>From:</strong> ${mail.sender} <br>`;
        email_info.innerHTML += `<strong>To:</strong> ${get_recipients(mail.recipients, true)} <br>`;
        email_info.innerHTML += `<strong>Timestamp:</strong> ${mail.timestamp} <br>`;

        email_description.append(email_info);

        // Let user archive the mail
        if (mailbox == "inbox"){
            archive_div = document.createElement("div");
            archive_div.className = "email-archv";

            arch_button = document.createElement("button");
            arch_button.dataset.id = id;
            arch_button.addEventListener("click", function(){
                console.log("Hell world")
                archive(this.dataset.id);
                load_mailbox("inbox");
            });
            arch_button.textContent = "Archive";
            arch_button.className = "btn btn-primary";

            archive_div.append(arch_button);
            email_description.append(archive_div);
        }
        else if (mailbox == "archive"){
            archive_div = document.createElement("div");
            archive_div.className = "email-archv";

            unarch_button = document.createElement("button");
            unarch_button.dataset.id = id;
            unarch_button.addEventListener("click", function(){
                console.log("Hell world")
                un_archive(this.dataset.id);
                load_mailbox("inbox");
            });
            unarch_button.textContent = "Unarchive";
            unarch_button.className = "btn btn-primary";

            archive_div.append(unarch_button);
            email_description.append(archive_div);
        }
        // Create reply button
        if (mailbox == "archive" || mailbox == "inbox"){
            reply_button = document.createElement("button");
            reply_button.className = "btn btn-primary";
            reply_button.dataset.id = mail.id;
            reply_button.textContent = "Reply";
            reply_button.addEventListener("click", function(){
                fetch(`emails/${id}`)
                .then(result => result.json())
                .then(mail => {
                    response = {
                        subject: mail.subject,
                        recipient: mail.sender,
                        pre_fill: `On ${mail.timestamp} ${mail.sender} wrote: ${mail.body}`
                    }
                    compose_email(response);
                })
            })
            email_description.append(reply_button);
        }
        // Create mail body
        mail_body = document.createElement("div");
        mail_body.className = "mail-body";
        mail_body.innerHTML += mail.body;
        email_div.append(email_description);
        email_div.append(mail_body);

    })

}

function assign_color(div, read)
{
    // if mail was read we assign color of lightgray else color of white
    if (read == true || read == "true"){
        div.style.backgroundColor = "#e0e0e0";
    }
    else{
        div.style.backgroundColor = "white";
    }
}

function mark_as_read(id){
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    })
}

function archive(id){
    console.log("Archiving")
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: true
      })
    })
}

function un_archive(id){
    console.log("Unarchiving")
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: false
      })
    })
}
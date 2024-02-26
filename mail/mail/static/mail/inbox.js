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
            mail_body: mail_body,
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
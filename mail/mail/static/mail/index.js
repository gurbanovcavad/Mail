document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', (e) => {
    e.preventDefault();
    send_email();
  });

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  
  // Show the mailbox name
  emails = document.querySelector('#emails-view');
  emails.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => {
    console.log(response);
    return response.json();
  })
  .then(data => {
    if(data.error) {
      console.log(data.error);
    } else {
      for(let i = 0, ln = data.length; i < ln; i++) {
        let element = data[i];
        let email = document.createElement("div");
        email.style.border = "1px solid black";
        email.style.borderRadius = "5px";
        email.style.marginBottom = "7px";
        email.style.height = "37px";
        email.style.alignContent = "center";
        email.style.cursor = 'pointer';
        email.innerHTML = `<span style="font-size:16px; font-weight: bold; margin-left:10px;">${element.sender}<span/> 
        <span style="font-size: 14px; font-weight: 600; margin-left: 20px;">${element.subject}<span/> 
        <span style="margin-left:670px; color: gray; font-size: 11px;">${element.timestamp}<span/>` 
        if(element.read === true) {
          email.style.backgroundColor = "rgb(217, 217, 217)";
          email.style.color = "rgb(1, 1, 133)";
        } 
        let ok = false;
        email.addEventListener('click', () => {
          view_email(element.id, mailbox);
          ok = true;
        })  
        if(ok) break;
        emails.append(email);
      }
    }
  });
}

function view_email(id, mailbox) {
  emails = document.querySelector('#emails-view');
  emails.innerHTML = "";
  fetch(`/emails/${id}`, {
    method: 'GET'
  })
  .then(response => {
    if(response.ok) {
      console.log(response);
    }
    return response.json();
  })
  .then(data => {
    if(data.error) {
      console.log(data.error);
    } else {
      console.log(data);
      fetch(`/emails/${id}`, {
        method: 'PUT', 
        body: JSON.stringify({
          archived: true
      })
      })
      let div = document.createElement('div');
      div.classList.add('email');
      let recipients = "";
      recipients += data.recipients[0];
      for(let i = 1, n = data.recipients.length; i < n; ++i) recipients += ", " + data.recipients[i];
      div.style.fontWeight = "100";
      if(mailbox === 'inbox') {
        let btn = (data.archived ? 'Unarchive' : 'Archive');
        div.innerHTML = `
          <div><span class="bold">From:<span/> ${data.sender}</div> 
          <div><span class="bold">To:<span/> ${recipients}</div> 
          <div><span class="bold">Subject:<span/> ${data.subject}</div> 
          <div><span class="bold">Timestamp:<span/> ${data.timestamp}</div> 
          <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button>
          <button class="btn btn-sm btn-outline-primary" id="archive">${btn}</button>
          <hr>
          <p>${data.body}<p/>
        `;
      } else {  
        div.innerHTML = `
          <div><span class="bold">From:<span/> ${data.sender}</div> 
          <div><span class="bold">To:<span/> ${recipients}</div> 
          <div><span class="bold">Subject:<span/> ${data.subject}</div> 
          <div><span class="bold">Timestamp:<span/> ${data.timestamp}</div> 
          <button class="btn btn-sm btn-outline-primary" id="reply">Reply</button>
          <hr>
          <p>${data.body}<p/>
        `;
      }
      emails.append(div);
      document.querySelector("#reply").addEventListener('click', () => {
        reply(data);
      })
      if(mailbox === 'inbox') {
        document.querySelector("#archive").addEventListener('click', () => {
          if(data.archived) {
            fetch(`/emails/${id}`, {
              method: "PUT",
              body: JSON.stringify({
                archived: false
              })
            })
          } else {
            fetch(`/emails/${id}`, {
              method: "PUT",
              body: JSON.stringify({
                archived: true
              })
            })  
          }
          load_mailbox('inbox');
        });
      }
    }
  });
}

function reply(data) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  let recipients = document.querySelector('#compose-recipients');
  recipients.value = data.sender;
  recipients.disabled = true;
  let subject = document.querySelector('#compose-subject');
  subject.value = data.subject;
  document.querySelector('#compose-body').value = `On ${data.timestamp} ${data.sender} wrote: ${data.body}`;
}

function send_email() {
  let form = document.forms['email-form'];
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      'recipients': form['recipients'].value,
      'subject': form['subject'].value,
      'body': form['body'].value
    })
  })
  .then(response => {
    if(response.ok) {
      console.log("OK");
    } 
    return response.json();
  })
  .then(result => {
    if(result.error) {
      console.log(result.erorr);
    } else {
      console.log(result.message);
    }
    load_mailbox('sent');
  });
  return false;
}
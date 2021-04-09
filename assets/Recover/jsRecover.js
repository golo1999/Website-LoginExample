const form=document.querySelector("form");
const usernameInput=document.querySelector("input[type=text]");
const newPasswordInput=document.querySelectorAll("input[type=password]")[0];
const confirmPasswordInput=document.querySelectorAll("input[type=password]")[1];
const recoverButton=document.querySelector("#recover-button");
const goBack=document.querySelector("#back");

document.querySelector("title").text="Recover password";
goBack.textContent="Back to login";
recoverButton.value="Reset your password";

recoverButton.onclick=() =>
{
    const usernameLength=usernameInput.value.trim().length, newPasswordLength=newPasswordInput.value.length, confirmPasswordLength=confirmPasswordInput.value.length;

    usernameInput.value=usernameInput.value.trim();
    //event.preventDefault(); // daca lasam linia asta, nu va fi recunoscut butonul in req.body.button
    if(usernameLength>5 && newPasswordLength>7 && confirmPasswordLength>7)
        form.submit();
    else if(usernameLength==0 && newPasswordLength==0 && confirmPasswordLength==0)
    {
        alert("Fields should not be empty");
        return false;
    }
    else if(usernameLength==0 && newPasswordLength==0)
    {
        alert("Username and new password should not be empty");
        return false;
    }
    else if(usernameLength==0 && confirmPasswordLength==0)
    {
        alert("Username and confirm password should not be empty");
        return false;
    }
    else if(newPasswordLength==0 && confirmPasswordLength==0)
    {
        alert("The passwords should not be empty");
        return false;
    }
    else if(usernameLength==0)
    {
        alert("Username should not be empty");
        return false;
    }
    else if(newPasswordLength==0)
    {
        alert("New password should not be empty");
        return false;
    }
    else if(confirmPasswordLength==0)
    {
        alert("Confirm password should not be empty");
        return false;
    }
    else if(usernameLength<6 && newPasswordLength<8 && confirmPasswordLength<8)
    {
        alert("Username should have at least 6 characters and passwords should have at least 8 characters");
        return false;
    }
    else if(usernameLength<6 && newPasswordLength<8)
    {
        alert("Username should have at least 6 characters and new password should have at least 8 characters");
        return false;
    }
    else if(usernameLength<6 && confirmPasswordLength<8)
    {
        alert("Username should have at least 6 characters and confirm password should have at least 8 characters");
        return false;
    }
    else if(newPasswordLength<8 && confirmPasswordLength<8)
    {
        alert("The passwords should have at least 8 characters");
        return false;
    }
    else if(usernameLength<6)
    {
        alert("Username should have at least 6 characters");
        return false;
    }
    else if(newPasswordLength<8)
    {
        alert("New password should have at least 8 characters");
        return false;
    }
    else if(confirmPasswordLength<8)
    {
        alert("Confirm password should have at least 8 characters");
        return false;
    }
};
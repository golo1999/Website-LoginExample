const form=document.querySelector("form");
const usernameInput=document.querySelector("input[type=text]");
const passwordInput=document.querySelector("input[type=password]");
const signinButton=document.querySelector("#signin-button");
const registerButton=document.querySelector("#register-button");
const forgotPassword=document.querySelector("#forgot-password");
const rememberMeText=document.querySelector("#remember-me");
const rememberMeInput=document.querySelector("#remember-me-input");

document.querySelector("title").text="Login";
forgotPassword.textContent="Recover password";
rememberMeText.textContent="Remember me";
signinButton.value="Sign in";
registerButton.value="Register";

signinButton.onclick=() =>
{
    const usernameLength=usernameInput.value.trim().length, passwordLength=passwordInput.value.length;

    usernameInput.value=usernameInput.value.trim();
    //event.preventDefault(); // daca lasam linia asta, nu va fi recunoscut butonul in req.body.button
    if(usernameLength>5 && passwordLength>7)
        form.submit();
    else if(usernameLength==0 && passwordLength==0)
    {
        alert("Username and password should not be empty");
        return false;
    }
    else if(usernameLength==0)
    {
        alert("Username should not be empty");
        return false;
    }
    else if(passwordLength==0)
    {
        alert("Password should not be empty");
        return false;
    }
    else if(usernameLength<6 && passwordLength<8)
    {
        alert("Username should have at least 6 characters and password should have at least 8 characters");
        return false;
    }
    else if(usernameLength<6)
    {
        alert("Username should have at least 6 characters");
        return false;
    }
    else if(passwordLength<8)
    {
        alert("Password should have at least 8 characters");
        return false;
    }
};

registerButton.onclick=() =>
{
    const usernameLength=usernameInput.value.trim().length, passwordLength=passwordInput.value.length;

    usernameInput.value=usernameInput.value.trim();
    
    if(usernameLength>5 && passwordLength>7)
        form.submit();
    else if(usernameLength==0 && passwordLength==0)
    {
        alert("Username and password should not be empty");
        return false;
    }
    else if(usernameLength==0)
    {
        alert("Username should not be empty");
        return false;
    }
    else if(passwordLength==0)
    {
        alert("Password should not be empty");
        return false;
    }
    else if(usernameLength<6 && passwordLength<8)
    {
        alert("Username should have at least 6 characters and password should have at least 8 characters");
        return false;
    }
    else if(usernameLength<6)
    {
        alert("Username should have at least 6 characters");
        return false;
    }
    else if(passwordLength<8)
    {
        alert("Password should have at least 8 characters");
        return false;
    }
};

rememberMeText.onclick=() =>
{
    let rememberMeClicked=rememberMeInput.checked;
    rememberMeInput.checked=!rememberMeClicked;
};
const rightDiv=document.querySelector(".right");

document.querySelectorAll("li")[0].onclick=function(){changeBackgroundColor("gold")};
document.querySelectorAll("li")[1].onclick=function(){changeBackgroundColor("purple")};
document.querySelectorAll("li")[2].onclick=function(){changeBackgroundColor("red")};
document.querySelectorAll("li")[3].onclick=function(){changeBackgroundColor("pink")};
document.querySelectorAll("li")[4].onclick=function(){changeBackgroundColor("orange")};

function changeBackgroundColor(color)
{
    rightDiv.style.backgroundColor=color;
}
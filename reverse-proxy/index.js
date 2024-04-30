const express=require("express");
const httpproxy=require("http-proxy");
const app=express();
const PATH = `https://vercel-cloned.s3.ap-south-1.amazonaws.com/__outputs`;
const proxy=httpproxy.createProxy();
app.use((req,res)=>{
const hostname=req.hostname;
const subdomain=req.hostname.split(".")[0];
const Redirect=`${PATH}/${subdomain}`;
return proxy.web(req,res,{target:Redirect,changeOrigin:true});
});
proxy.on("proxyReq",(proxyReq,req,res)=>{
    const Url=proxyReq.Url;
    if(Url==="/"){
        proxyReq.path= `${Url}index.html`;
        return proxyReq;
    }
})
app.listen(8000);
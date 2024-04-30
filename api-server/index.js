const express=require("express");
const randomwords=require("random-word-slugs");
const { ECSClient, ListTasksCommand, RunTaskCommand } = require("@aws-sdk/client-ecs");
const redis = require("ioredis");
const { Server } = require("socket.io");
const app=express();
app.use(express.json());
const Subscriber = new redis(
    "rediss://default:AVNS_y0XI0L6kxA3HbHWHocp@redis-346ae707-vercellogs.d.aivencloud.com:21097"
  );
const io=new Server({cors:"*"});
io.on("connection",socket=>{
    socket.on("subscribe",channel=>{
        socket.join(channel);
        socket.emit("message",`joined: ${channel}`)
    })
})
const client = new ECSClient({ 
    region:'ap-south-1', 
credentials:{
    AccessKeyId:'AKIA3SCBODGQPMJQBJ6U',
    secretAccessKey:'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'
} });
const config={
    CLUSTER:"arn:aws:ecs:ap-south-1:794706188704:cluster/vercelCluster",
    TASK:"arn:aws:ecs:ap-south-1:794706188704:task-definition/builder:1"
}
app.post("/project",async (req,res)=>{
    const {gitURL}=req.body;
    const projectslug=randomwords.generateSlug();
    const command=new RunTaskCommand({
        cluster:config.cluster,
        taskDefinition:config.TASK,
        launchType:"FARGATE",
        count:1,
        networkConfiguration:{
            awsvpcConfiguration:{
                assignPublicIp:"ENABLED",
                subnets:["subnet-0b7ad3f018439c5be","subnet-0a6ba2bc5403ec48c","subnet-05c5e2612fd49ab8d"],
                securityGroups:"sg-04e32fc440eb85c5b",
            }
        },
        overrides:{
            containerOverrides:{
                name:"vercelImage",
                environment:[
                    {name:"GIT_REPO_URL",value:gitURL},
                    {name:"project_id",value:projectslug}
                ]

            }
        }
    })
    await client.send(command);
    return res.json({status:"QUEUED",data:{projectslug,url:`http://${projectslug}.localhost:8000/`}});
});

async function initRedisSub(){
    console.log("subscribed")
    Subscriber.psubscribe("logs:*");
    Subscriber.on("pmessage",(pattern,channel,message)=>{
        io.tochannel(channel).emit("message",message);
    })
}
initRedisSub();
app.listen(5000);

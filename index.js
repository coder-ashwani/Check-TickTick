const express =  require('express');
const bcrypt = require('bcrypt');
const { UserModel, TodoModel } = require('./db');
const jwt = require('jsonwebtoken');// for authentication
const { default: mongoose } = require('mongoose');
const {auth,JWT_SECRET} = require('./auth');
const app = express();
const port = 3000;
const {z} = require("zod");

mongoose.connect("mongodb+srv://ashwaniagarwal333:XcmQcfuS2Hp6KkGV@cluster0.0fcqw3z.mongodb.net/todo-app-database");


app.use(express.json());

app.post('/signup',async(req,res)=>{
    ///adding input validation
    //structure of input
    // const passwordregex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;
    const requiredBody = z.object({
        email: z.string().email(),
        password: z.string().min(6).max(20).refine((value) => /[a-z]/.test(value), {
            message: "Password must contain at least one lowercase letter",
          })
          .refine((value) => /[A-Z]/.test(value), {
            message: "Password must contain at least one uppercase letter",
          })
          .refine((value) => /\W/.test(value), {
            message: "Password must contain at least one special character",
          }),
        // regex(passwordregex,{
        //     message:'Password should contain atleast one digit, one lowercase and one uppercase letter and should be between 6 to 20 characters'
        // }),
        name: z.string().min(3).max(20)
    })
    const ParsedDatawithsuccess = requiredBody.safeParse(req.body); ///safeParse will return an object with success and data
    if(!ParsedDatawithsuccess.success){
        res.json({
            message:'incorrect data',
            error : ParsedDatawithsuccess.error
        })
        return;
    }
    
    
    const email = req.body.email;
    const password = req.body.password; 
    const name = req.body.name;
    
    let errorthrown = false;
    try{
        const hashedPassword = await bcrypt.hash(password,5);
        // console.log(hashedPassword);
         await UserModel.create({
            email:email,
            password:hashedPassword,
            name:name
        })
    }
    catch(e){
        // console.log("Duplicate email");
        res.status(500).send({
            message:'Something went wrong Maybe email already exists'
        })
        errorthrown = true;
        return;
    }
    // console.log(response);
    if(!errorthrown){
        res.send({
            message: 'User created Successfully'
        })
    }
    
})

app.post('/signin',async(req,res)=>{
    const email = req.body.email;
    const password = req.body.password;

    const response = await UserModel.findOne({
        email:email
        
    })
    if(!response){
        res.status(403).send({
            message:'user does not exist'
        })
        return;
    }

    //comparing the hashed password
    const passwordMatch = await bcrypt.compare(password, response.password);
    // console.log(user)

    if(passwordMatch){
        const token = jwt.sign({
           id : response._id.toString(),  // converting object id to string
        },JWT_SECRET)
        res.send(
            {
                token:token
            })
    }
    else{
        res.status(403).send({
            message:'Invalid credentials'
        })
    }
})

//below endpoints should be authenticated
//endpoint for creating a todo
app.post('/todo',auth,async(req,res)=>{
    const userId = req.userId;
    const title = req.body.title;
    const done = req.body.done;
    await TodoModel.create({
        title:title,
        done:done,
        userId:userId
    })
    res.send({
        message:'Todo created successfully'
    })
})


//endpoint for getting all todos of a user
app.get('/todos',auth,async(req,res)=>{
    const userId = req.userId;
    const todos = await TodoModel.find({
        userId:userId
    })
    res.send(todos);
})

app.listen(port,()=>{
    console.log("Server is running on port 3000");
}
)
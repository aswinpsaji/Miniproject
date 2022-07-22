const express = require('express');

const path =  require('path');

const app= express();

const MURI= 'mongodb+srv://mongo:jonathan@cluster0.2uncw.mongodb.net/test2'

const bp= require('body-parser');
var phantomjs = require('phantomjs-prebuilt')

const bcrypt= require('bcryptjs');
const session = require('express-session');
const User= require('./model/user');

const mongoose = require('mongoose'); 

const con= require('./model/cont');

const mongostore= require('connect-mongodb-session')(session);

const store =new mongostore({
    uri: MURI,
    collection: 'sessions'
});
app.use(
   session({secret: 'my secret', resave: false, saveUninitialized:false,store:store})
);

//pdf logic starts here

const pdf = require('pdf-creator-node');


const fs = require("fs");

const template = fs.readFileSync("./views/pdfhtml.ejs","utf-8");

const options = {

    format : "A4",
    orientation : 'portrait',
    border:"10mm"
};


//pdf logic ends here

app.use(express.static('public'));

app.use(express.json());

app.set('view engine','ejs');
// app.set('views', path.join(__dirname, 'views'));

app.use(bp.urlencoded({extended:false}));


// app.post('/gettopic',(req,res)=>{
//    const {parcel}= req.body;
//    console.log(parcel);
//    con.updateMany({},{"$set":{selected:false}})
//    .then(c=>{
//       con.findOneAndUpdate({topic: parcel},{selected: true})
//       .then(c=>{
//          con.find().then(c=>{
//             console.log('ethi');
//             res.render('mytopics',{alldata : c,success:'Topic selected'});
            
//           }
//           ).catch(err=>{
//              console.log(err);
//           });
//       })
//       .catch(err=>{
//          console.log(err);
//       });
      
//    })
//    .catch(err=>{
//       console.log(err);
//    });
   
  
// });



app.post('/save',(req,res,)=>{
   
   const c= new con({
      topic: req.body.topic,
      selected: false,
      content: [],
      userid: req.session.user
   });
   c.save()
   .then(c=>{
       
        console.log(c);
        res.render('index',{success: "Data inserted!"});
  
     })
     .catch(err=>{
        console.log(err);
     });
});






app.get('/gettopic',(req,res)=>{
 
   con.find({userid: req.session.user._id}).then(c=>{
   
      res.render('mytopics',{alldata : c,success:''});
      
    }
    ).catch(err=>{
       console.log(err);
    });
   
 
});

app.get('/gettopic/:topic',(req,res)=>{
   
   
   const parcel= req.params.topic;
   console.log(parcel);
   con.updateMany({},{"$set":{selected:false}})
   .then(c=>{
      con.findOneAndUpdate({topic: parcel,userid: req.session.user._id},{selected: true})
      .then(c=>{
         
            console.log('found');
            res.render('successpage',{success:'Topic selected'});
            
        
      })
      .catch(err=>{
         console.log(err);
      });
      
   })
   .catch(err=>{
      console.log(err);
   });

});



//pdf logic goes here
app.get('/pdfmytopics',(req,res)=>{
  
   con.find({userid: req.session.user._id}).then(c=>{
      console.log('ethi');
      res.render('pdfmytopics',{alldata : c});
      
    }
    ).catch(err=>{
       console.log(err);
    });
   
 
});

//pdf logic ends here




// app.post('/gettopic',(req,res)=>{
  
//    const {parcel}= req.body;
   
//    console.log('post');
//    res.redirect('/xhowing?topic=' + parcel);
//    console.log( parcel+'parcel');
   
   
 
// });

app.get('/xhowing/:topic',(req,res)=>{

   const t= req.params.topic;
 
   con.findOne({topic: t,userid: req.session.user._id})
   .then(c=>{
      console.log(c);
       res.render('show',{alldata : c});
   })
   .catch(err=>{
      console.log(err);
   });

});

app.get('/pdfhowing/:topic',(req,res)=>{

   const t= req.params.topic;

   con.findOne({topic: t,userid: req.session.user._id}).lean()
   .then(c=>{
      
    
      let items = [];
      items.push(c);
      console.log(items[0].topic);
      console.log(items[0].content);
      let document = {
          html : template,
          data:{
              d : items,
              contentarray : items[0].content
          },
          path: "pdfhtmlq.pdf"
      };
      
      pdf.create(document,options)
      .then(() =>  {var data= fs.readFileSync('./pdfhtmlq.pdf');
      res.contentType("application/pdf");
      res.send(data);})
      .catch((err) => console.log(err));
      
      
   })
   .catch(err=>{
      console.log(err);
   });

});





app.get('/signup',(req,res)=>{
   res.render('signup');
});

app.get('/index',(req,res)=>{
   res.render('index',{success: ''});
});


app.post('/signup',(req,res)=>{
   const email= req.body.email;
   const pass= req.body.psw;
   User.findOne({email:email})
   .then((doc)=>{
    if(doc){
        return res.redirect('/signup');
    }
    return bcrypt.hash(pass,12)
    .then(hashed=>{
        const user= new User({
            email:email,
            password:hashed,
            inside: {topic: [] }
        });
        return user.save();
    })
    .then(result=>{
        res.redirect('/');
    });
   
   }).catch((err)=>{
    cosole.log(err);
   });
});

app.post('/signout',(req,res)=>{
   req.session.destroy((err)=>{


       res.redirect('/');
       
   });
   console.log('post');
   
  });

app.post('/',(req,res)=>{
   const email = req.body.email;
   const password = req.body.psw;
   
   User.findOne({ email: email })
     .then(user => {
       if (!user) {
         return res.redirect('/');
       }
       bcrypt
         .compare(password, user.password)
         .then(doMatch => {
           if (doMatch) {
             req.session.isLoggedIn = true;
             req.session.user = user;
             console.log(req.session.user);
             return req.session.save(err => {
               
               res.render('index',{success: ''});//
             });
           }
           res.redirect('/');
         })
         .catch(err => {
           console.log(err);
           res.redirect('/');
         });
     })
     .catch(err => console.log(err));
});


app.get('/',(req,res)=>{
   res.render('signin');
});

mongoose.connect('mongodb+srv://mongo:jonathan@cluster0.2uncw.mongodb.net/test2?retryWrites=true&w=majority')
// mongoose.connect('mongodb+srv://roshan:roshan@searchbook.9bw1f7a.mongodb.net/first?retryWrites=true&w=majority')
.then(()=>{
   const PORT = process.env.PORT || 3000;
   app.listen(PORT);
   console.log("Mongodb live");})
.catch(result=>{console.log('error');});
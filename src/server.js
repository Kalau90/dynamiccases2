require("dotenv-flow").config({ default_node_env: "development" });
const express = require("express");
const app = express();
const exphbs  = require('express-handlebars');
const port = process.env.PORT || 3001;
const bodyParser = require("body-parser");
const routes = require("./routes.js");
const path = require("path");
const Promise = require("promise");
const request = require("request");
const fs = require("fs");
const knex = require("./knex.js")

const kasware = require("./kasperware/index.js");
//const { default: knex } = require("knex");
kasware(app, ["kasvar"]);


app.use(bodyParser.json());

app.use("/delphinus", express.static("./node_modules/@aarhus-university/au-designsystem-delphinus/build/"))

app.use("/api", routes);

app.use(express.static(path.join(__dirname, "./")));


app.set('views', path.join(__dirname))
//let layouts = path.join(__dirname, "./intelcase/layouts/main")
//let partials = "./intelcase/partials"
//let partials = path.join(__dirname, "./intelcase/partials")
//console.log(partials);
app.engine('hbs', exphbs({
	path: '/views/',
    layoutPath: '/views/layout',
    extname: '.hbs'
}));
app.set('view engine', 'hbs')



async function getCaseset(casesetid){
	const caseset = await knex("caseset").where({caseset_id: casesetid}).limit(1)
	return caseset;
}

app.get(["/:step/:casesetid/", "/:step/", "/"], async function(req, res) {
	let errors = "";
	const casesetid = req.params.casesetid || null;
	const step = req.params.step || "mycases";
	let caseset = new Array({});
	console.log(step)
	if(step!="mycases"){
		caseset_req = await getCaseset(casesetid);
		console.log(caseset_req)
		console.log(caseset_req.length)
		if(caseset_req.length<1){
			errors+="Det caseset ID, du har valgt, er ikke gyldigt"
		}else{
			caseset = caseset_req[0]
		}
	}
	
	res.render("views/"+step, {step: step, casesetid: casesetid, caseset: caseset, error: errors});
});

app.get("*", function(req,res){
	res.send("HEJ")
})


app.listen(port);
console.log("Server running on localhost:" + port);
const express = require("express");
const router = express.Router();
const knex = require("./knex");

function upperCaseFirstLetter(text){
	return text[0].toUpperCase() + text.slice(1);
  }

async function generateSmartText(text, patientId, caseActionId){
	// Takes text and patientId
	// Replaces parameters in text by patientId
	// Return replaced text
	
	let fillerText = text;
	
	//fillerText = await replaceSymptomLists(patientId, caseActionId, fillerText);
  
	fillerText = await replaceParameters(patientId, fillerText);
	fillerText = await replaceParameters(patientId, fillerText); // run again to replace {{ gender }} in parametertexts
	return fillerText;
  }

const replaceParameters = async (caseid, text) => {
	//let output = text;
  
	console.log("Get parameter values for patient "+caseid);
	let newText = text;
	
	const parameterStuff = await getCaseParameters(caseid);
	console.log("Stuff",parameterStuff)
	const paramNames = parameterStuff.paramNames;
	const semReplaces = parameterStuff.semReplaces;
	
   // console.log("What are my paramNames",paramNames);
	
	//const semReplaces = await //;
	  
	  /* DO THE REPLACEMENTS */
	  const paramReg = new RegExp('{([ ]|)(' + paramNames.join('|') + ')(:[0-9]|)([ ]|)}*', 'gi');
  
	return newText.replace(paramReg, function(x) {
	  // x contains the entire string like "{gender:3}" or "{name}"
	  // if there is no ":*", then it is read as "{x:0}"
	  let split = x.split(':');
	  let param = split[0].substr(1);
	  console.log(param)
	  let number = 0;
	  if (split.length > 1) {
		number = Number(split[1].substr(0, split[1].length - 1).trim());
	  } else {
		param = param.substr(0, param.length - 1).trim();
	  }
  
	  if (param.trim().substr(0, 1) == param.trim().substr(0, 1).toUpperCase()) {
		// is the parameter capital letter? (e.g. "{Gender}")
		param = param.toLowerCase().trim();
  
		if(semReplaces[param][number]){
		  return upperCaseFirstLetter(semReplaces[param][number]);
		}else{
			console.log("Param "+param+" is not defined for case");
			return;
		}
	  } else {
		  param = param.trim();
		  if(semReplaces[param][number]){
			  return semReplaces[param][number];
		  }else{
			  console.log("Param "+param+" is not defined on patient");
			  return;
		  }
	  }
	});
  
	return newText;
	//return text + "," + patientId;
  };


function makeSemReplacesObj(semReplaces){
	semReplaces['subject'] = [];
  semReplaces['subject'][0] = "patienten";
  var age, gender;
  
  //console.log(semReplaces);
	
	// AGE
	if(semReplaces['age']){
	  age = semReplaces['age'][0];

	  if (age < 10) {
		semReplaces['age'].push('0');
	  } else {
		semReplaces['age'].push(Math.floor(age / 10) + '0');
	  }

	  if (age < 3) {
		semReplaces['age'].push('spæd');
	  } else if (age < 19) {
		semReplaces['age'].push('ung');
	  } else if (age < 60) {
		semReplaces['age'].push('voksen');
	  } else if (age < 120) {
		semReplaces['age'].push('gammel');
	  } else {
		semReplaces['age'].push('død');
	  }
	}else{
		age = 0;
	}
	//console.log(semReplaces);
	
	if(semReplaces['gender']){
	  // GENDER
	  gender = semReplaces['gender'][0];

	  if (gender == '0') {
		semReplaces['gender'].push('hun', 'hende', 'hendes');
		if (age < 30) {
		  semReplaces['gender'].push('frk');
		} else {
		  semReplaces['gender'].push('fru');
		}
		if (age < 14) {
		  semReplaces['gender'].push('pige', 'pigen');
		} else {
		  semReplaces['gender'].push('kvinde', 'kvinden');
		}
	  } else if (gender == '1') {
		semReplaces['gender'].push('han', 'ham', 'hans');
		semReplaces['gender'].push('hr');
		if (age < 14) {
		  semReplaces['gender'].push('dreng', 'drengen');
		} else {
		  semReplaces['gender'].push('mand', 'manden');
		}
	  } else {
		semReplaces['gender'].push('hen', 'dem', 'deres');
		semReplaces['gender'].push('xr');
		semReplaces['gender'].push('person', 'personen');
	  }
	  semReplaces['subject'][1] = semReplaces['gender'][1];
	}
  return semReplaces;
}

async function getCaseParameters(caseId){
	let semReplaces = {};
	let paramNames = ["subject"];
	
	/* GET CASE PARAMETER VALUES FROM MySQL */
	let caseParameters = {};
	let paramname, paramvalue, paramstate;
	const paramValues = await knex("parameter").join( "casevsparameter", "parameter.parameter_id", "=", "casevsparameter.parameter_id")
	.where({"casevsparameter.case_id": caseId})
    .then(function(Rows) {
		for (let row of Rows) {
			if(!row["value"]){
				console.log("NO VALUE for "+paramcode+" on case "+caseId);
			}
			paramcode = row["parameter_code"];
			console.log(paramcode);
			paramvalue = row["value"];
			paramstate = 0;//row["state"];
			paramunit = row["parameter_unit"];
			semReplaces[paramcode] = [];
			semReplaces[paramcode].push(paramvalue);
			if(paramunit!==null){
				semReplaces[paramcode].push(paramvalue+" "+paramunit);
			}
			paramNames.push(paramcode);
			//output = output.replace("{" + paramcode + "}", paramvalue);
			//console.log(Rows);
		}
	})
    .catch(function(error) {});
	console.log("NU",semReplaces)
	
	/* MAKE SEMREPLACES OBJECT */
	semReplaces = makeSemReplacesObj(semReplaces);
	
	return {"paramNames": paramNames, "semReplaces": semReplaces};
}




async function deleteParametersByCasesetId(casesetid){
	parameters = await knex("casesetvsparameter").where({caseset_id: casesetid})
	for(let p of parameters){
		await knex("parameter").where({parameter_id: p.parameter_id}).delete()
		await knex("casesetvsparameter").where({casesetvsparameter_id: p.casesetvsparameter_id}).delete()
	}
}

async function addParameterToCasesetId(keys, casesetid){
	for(let key of keys){
		const code = key.substr(0, 5).toLowerCase();
		const param_id = await knex("parameter").insert({parameter_name: key, parameter_code: code, parameter_type: 0}).returning("id")
		await knex("casesetvsparameter").insert({parameter_id: param_id, caseset_id: casesetid})
	}
}

async function deleteCasesByCasesetId(casesetid){
	await knex("case").where({caseset_parentid: casesetid}).delete();
}

router.post("/addCasesetParameters", async function (req, res) {
    const {casesetid, keys, rows } = req.body;
	await deleteParametersByCasesetId(casesetid)
	await addParameterToCasesetId(keys, casesetid)
	await deleteCasesByCasesetId(casesetid)

	for(let row of rows){
		const case_id = await knex("case").insert({caseset_parentid: casesetid, user_id: 1, case_added: knex.fn.now(), pattern_parentid: 1})
		for(let p in row){
			const parameter = await knex("parameter").where({parameter_name: p})
			const parameter_id = parameter[0].parameter_id;
			await knex("casevsparameter").insert({case_id: case_id, parameter_id: parameter_id, value: row[p]})
		}
	}

	await knex("parameter").where({parameter_name: "Køn"}).update({parameter_code: "gender"})
	await knex("parameter").where({parameter_name: "Alder"}).update({parameter_code: "age"})
	await knex("casevsparameter").where({value: "Mand"}).update({value: 1})
	await knex("casevsparameter").where({value: "Kvinde"}).update({value: 0})

	res.send("OK!")
});

router.post("/listCasesets", async function (req, res) {
	//const { casesetid } = req.body
	const casesets = await knex("caseset");//.where({caseset_parentid: casesetid})
	res.send(casesets);
});

router.post("/listCases", async function (req, res) {
	const { casesetid } = req.body
	//const casesetid = 1;
	//console.log("TRIG",req.body)
	const cases = await knex("case").where({caseset_parentid: casesetid});
	res.send(cases);
});

router.post("/getCases", async function (req, res) {
	const { casesetid } = req.body
	const cases = await knex("case").where({caseset_parentid: casesetid});
	let case_list = new Array();
	for(let c of cases){
		let caseobj = {};
		const params = await knex("casevsparameter").where({case_id: c.case_id}).join("parameter", "casevsparameter.parameter_id", "=", "parameter.parameter_id")
		let case_param = new Array();
		for(let p of params){
			case_param.push(p);
		}
		caseobj.info = c;
		caseobj.p = params;
		case_list.push(caseobj)
	}
	
	res.send(case_list);
});

router.post("/listParameters", async function (req, res) {
	const { casesetid } = req.body
	const parameters = await knex("casesetvsparameter").where({caseset_id: casesetid}).join("parameter", "parameter.parameter_id", "=", "casesetvsparameter.parameter_id")
	//console.log(parameters)
	res.send(parameters);
});

router.post("/getSemReplacesObj", async (req, res) => {
	const { caseid } = req.body;
  
	const parameterStuff = await getCaseParameters(caseid);
	const semReplaces = parameterStuff.semReplaces;
	console.log(semReplaces);
  
	res.send(semReplaces);
  });




router.post("/test", async function (req, res) {
    const {casesetid, paramofpattern, patterns, parameters } = req.body;
	//console.log(req.body)
    //console.log(parameters)
    //const casesets = await knex("caseset");
    //console.log(casesets)
	/*var patients = [];
	let { caseId } = req.body;//
	
	const patientIds = await knex("patients").where({case_id: caseId});
	//console.log(patientIds);
	for(var p in patientIds){
		patients.push(new Patient());
		await patients[p].readFromDB(patientIds[p].patient_id);
	}
	
	let returner = [];
	for(let p of patients){	
		returner.push(JSON.parse(JSON.stringify(p)));
	}*/
	res.send("YO!");
});

  router.post("/generateText", async (req, res) => {
	const { text, caseid, caseActionId } = req.body;
	let fillerText = {};
	fillerText.text = await generateSmartText(text, caseid, caseActionId);
	
	res.send(fillerText);
  });

module.exports = router;

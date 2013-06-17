var readline = require('readline')


exports.question = function(ask,callback){
	ask || (ask = 'Default question?')

	var args = Array.prototype.slice.call(arguments,0)
	var rl = readline.createInterface({
  		input: process.stdin,
  		output: process.stdout
	});

	rl.question(ask, function(answer) {
		rl.close();

  		if(typeof callback === 'function'){
  			callback.redo = function(){
  				exports.question.apply(null,args)
  			}
  			callback.call(callback,answer)
  		}
	});
}
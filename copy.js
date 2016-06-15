var fs = require('fs-extra');
var watch = require('watch');
var minimatch = require('minimatch');
var colors = require('colors');
var Path = require('path');

var cfg = fs.readJsonSync('copy_config.json');
for (var rule in cfg.rules)
	fs.mkdirsSync(cfg.rules[rule]);	

fs.emptyDirSync(cfg.clean);

watch.unwatchTree(cfg.watch);
watch.watchTree(cfg.watch, { interval: cfg.delay }, function(f, curr, prev) {
	if (typeof f == "object" && prev === null && curr === null) {
		return firstCopy(f);
	} else if (prev === null) {
		return matchAndCopy(f, 0);
	} else if (curr.nlink === 0) {
		return matchAndDelete(f);
	} else {
		return matchAndCopy(f, 0);
	}
});

function firstCopy(f) {
	var res = 0;
	for (var fname in f) 
		if (f[fname].isFile())
			res += matchAndCopy(fname, 1);
	console.log(('首次复制完成,共计: ' + res + ' 个文件!').cyan);
}

function matchAndDelete(fname) {
	var rfname = Path.relative(cfg.watch, fname);
	for (var rule in cfg.rules)
		if (minimatch(rfname, rule))
			return fs.unlinkSync(Path.join(cfg.rules[rule], rfname ) ), console.log(('删除文件 '+fname+' 成功!').blue), 1;
}

function matchAndCopy(fname, first) {
	var rfname = Path.relative(cfg.watch, fname);
	for (var rule in cfg.rules)
		if (minimatch(rfname, rule))
			return fs.copySync(fname, Path.join(cfg.rules[rule], rfname ) ), (first || console.log(('复制文件 '+fname+' 成功!').green) ), 1;
	first || console.log(('忽略文件 ' + fname).gray);
	return 0;
}
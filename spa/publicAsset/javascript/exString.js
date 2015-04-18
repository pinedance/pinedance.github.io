String.prototype.gsub = function(bf, af){
    var all_bf = new RegExp(bf, "g");
    return this.replace(all_bf, af);
}; // http://stackoverflow.com/questions/7951768/does-something-similar-to-gsub-exist-in-javascript

// match 된 횟수 계산
String.prototype.matchCount = function(bf){
    var all_bf = new RegExp(bf, "g");
    var result = this.match(all_bf)
    return result ? this.match(all_bf).length : 0;
}; 
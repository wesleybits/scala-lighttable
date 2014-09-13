CodeMirror.defineMode("scala2", function(config, parserConfig) {
  
  function peekOrElse(state, deflt) {
    if (state.scopes.lenght == 0) return deflt;
    else {
      var rval = state.scopes.pop();
      state.scopes.push(rval);
      return rval;
    };
  };
  
  function initState() {
    return {
      scopes: new Array(0)
    };
  };
  
  var keywords = 
      /^((package)|(import)|(sealed)|(case)|(private)|(override)|(extends)|(with)|(implicit)|(try)|(catch)|(for)|(yeild)) /;
  
  var keywords2 =
      /^((try)|(catch)|(for)|(yeild)|(while))/;
  
  var keywords3 =
      /^((this))/;
  
  var definitionWords = 
      /^((def)|(val)|(var)|(class)|(trait)|(interface)|(object)) /;
  
  var flowControl =
      /^((map)|(flatMap)|(foldLeft)|(foldRight)|(fold)|(filter)|(apply)|(compose)|(andThen)|(recover(Total)?)|(if)|(else)|(match))/;
  
  var character =
      /^(('\\.')|('[~\']'))/;
  
  var symbol =
      /^('[a-z_A-Z0-9]+)/;
  
  var typeRef =
      /^[A-Z][a-z_A-Z0-9]*/;
  
  function parseString1(stream, state) {
    while (! stream.eol()) {
      if (stream.eat('\\')) stream.next();
      if (stream.eat('"')) {
        state.scopes.pop();
        return 'string';
      } else stream.next();
    };
    
    return 'string';
  };
  
  function parseString2(stream, state) {
    while (! stream.eol()) {
      if (stream.eat('\\')) stream.next();
      if (stream.match('"""', true)) {
        state.scopes.pop();
        return 'string';
      } else stream.next();
    };
    
    return 'string';
  };
  
  function parseComment(stream, state) {
    while (! stream.eol()) {
      if (stream.match("*/")) {
        state.scopes.pop();
        return 'comment';
      } else stream.next();
    };
    
    return 'comment';
  };
  
  function parseDefParen(stream, state) {
    if (stream.eat("(")) {
      state.scopes.push('def-paren');
      return 'variable';
    }
    
    if (stream.eat(")")) {
      state.scopes.pop();
      return 'variable';
    };
    
    if (stream.eat(",")) return 'variable';
    
    stream.eatWhile(/[^ ,()]/);
    return 'def';
  }
  
  function parseDef(stream, state) {
    if (stream.eat("(")) {
      state.scopes.pop();
      state.scopes.push('def-paren');
      return 'variable'
    };
    
    stream.eatWhile(/[^ ,(){}]/);
    state.scopes.pop();
    return 'def';
  };
  
  function parseTopLevel(stream, state) {
    // parse keywords
    if (stream.match(keywords))
      return 'builtin';
    
    if (stream.match(keywords2) && stream.match(/^[ ({]/, false)) {
      return 'builtin';
    };
    
    // parse underscore
    if (stream.eat("_") && (stream.match(/^\W/, false) || stream.eol()))
      return 'builtin';

    // parse definition words
    if (stream.match(definitionWords)) {
      state.scopes.push('def');
      return 'builtin';  
    };

    // parse line comments
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'comment';
    };
    
    // parse block comments
    if (stream.match('/*')) {
      state.scopes.push('comment');
      return 'comment';
    };
    
    // parse chars/symbols
    if (stream.eat("'")) {
      if (stream.match(/^[a-z_A-Z][a-z_A-Z0-9]+/)) return 'symbol';
      else {
        if (stream.eat('\\')) stream.next();
        stream.next();
        if (stream.eat("'")) return 'string';
        else return 'variable';
      };
    };
    
    // single-line string, or multi-line strings
    if (stream.match('"""')) {
      state.scopes.push('string3');
      return 'string';
    };
    
    if (stream.eat('"')) {
      state.scopes.push('string1');
      return 'string';
    };
    
    // parse type refs
    if (stream.match(typeRef)) return 'variable-2';
    
    // parse the thick arrows
    if (stream.match("=>")) return 'atom';
    
    // parse flow control
    if (stream.match(flowControl) && (stream.match(/^[ ({]/, false) || stream.eol()))
      return 'atom';
    
    // parse regular names and numbers
    if (
      stream.match(/^[1-9][0-9]*([.][0-9]+)?[flFL]?/) ||
      stream.match(/^0[xob][a-fA-F0-9]+/) ||
      stream.match(/^0+/)
    )
      return 'variable';
    else if (stream.match(/^[a-z_A-Z0-9]+(_\S)?/) || stream.match(/^[ (){}[]]/))
      return 'variable';
    else {
      stream.next();
      return 'operator';
    };
  };
  
  var extern = {
    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      
      var curScope = peekOrElse(state, 'variable');
      
      if (curScope == 'string1')        return parseString1(stream, state);
      else if (curScope == 'string3')   return parseString2(stream, state);
      else if (curScope == 'comment')   return parseComment(stream, state);
      else if (curScope == 'def')       return parseDef(stream, state);
      else if (curScope == 'def-paren') return parseDefParen(stream, state);
      else 
        return parseTopLevel(stream, state);
    },
    
    startState: function() { return initState(); }
  };
  
  return extern;
});

CodeMirror.defineMIME("text/scala", "scala2");

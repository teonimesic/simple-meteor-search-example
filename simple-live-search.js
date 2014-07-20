Articles = new Meteor.Collection('articles');

// Dado um conjunto de palavras chaves, gerar uma query que contenham pelo menos uma das palavras
// chaves passadas em 'keywords' em qualquer atributo definido em 'searchFields', não diferenciando maiúsculas/minúsculas
function searchQuery(keywords) {
  if ( keywords && keywords !== '' ) {
    var searchFields = ['title','description'];
    var searchQuery = [];
    _.each(searchFields, function (field) {
      searchKeywords = {};
      searchKeywords[field] = { $regex: keywords.split(' ').join('|'), $options: 'i' };
      searchQuery.push(searchKeywords);
    });
    // busca em qualquer um dos atributos. Sem isso ele buscaria em todos
    return {$or: searchQuery};
  }
}

if ( Meteor.isServer ) {
  // Cria um 20 artigos fake pra passar do 'limite' de 10 artigos definidos no publish
  Meteor.startup(function (){
    _.times(20, function (index) {
      var title = 'Artigo super bacana sobre algo! {' + index + '}';
      var description = 'Descrição bem curta desse artigo. Sei que vai amar!';
      Articles.upsert({title: title}, {title: title, description: description});
    });
  })

  Meteor.publish('searchArticles', function (keywords) {
    if ( searchQuery(keywords) ) {
      return Articles.find(searchQuery(keywords), {limit: 10});
    } else {
      // caso as palavras chaves estejam vazias não retorna artigo algum
      return [];
    }
  });
}

if ( Meteor.isClient ) {
  Meteor.startup(function (){
    Session.set('keywords', 'artigo');
  })

  // Roda de novo sempre que as palavras chaves mudarem
  Deps.autorun(function () {
    // busca de artigos que contenham as palavras chave
    Meteor.subscribe('searchArticles', Session.get('keywords'));
  });

  Template.results.articles = function () {
    keywords = Session.get('keywords');
    if ( searchQuery(keywords) ) {
      return Articles.find(searchQuery(keywords));
    } else {
      // caso as palavras chaves estejam vazias não retorna artigo algum
      return [];
    }
  }

  Template.search.events = {

    // A cada 500 milisegundos depois que o usuário digitar algo, setar
    // as palavras chave como o valor definido no campo de busca.
    // Ignorar buscas com menos de 3 letras.
    'keyup input': function (e) {
      lazySetKeywords(e.currentTarget.value);
    }
  }

  function setKeywords(keywords) {
    if ( keywords.length >= 3 ) {
      Session.set('keywords', keywords);
    } else {
      Session.set('keywords', '');
    }
  };
  var lazySetKeywords = _.debounce(setKeywords, 500);

  Template.addArticle.events = {

    // Criação de Artigos
    'submit': function (e, template) {
      var title = $(template.find('[name="title"]')).val()
      var description = $(template.find('[name="description"]')).val()
      Articles.insert( {title: title, description: description} );

      // parar propagação do submit
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
}
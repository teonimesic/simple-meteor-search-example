Articles = new Meteor.Collection('articles');

if ( Meteor.isServer ) {
  
  // Dado um conjunto de palavras chaves, gerar uma query que contenham pelo menos uma das palavras
  // chaves passadas em 'keywords' em qualquer atributo definido em 'searchFields', não diferenciando maiúsculas/minúsculas
  Meteor.publish('searchArticles', function (keywords) {
    if ( keywords && keywords !== '' ) {
      var searchFields = ['title','description'];
      var searchQuery = [];
      _.each(searchFields, function (field) {
        searchKeywords = {};
        searchKeywords[field] = { $regex: keywords.split(' ').join('|'), $options: 'i' };
        searchQuery.push(searchKeywords);
      });
      // busca em qualquer um dos atributos. Sem isso ele buscaria em todos
      return Articles.find({$or: searchQuery});
    } else {
      return [];
    }
  });
}

if ( Meteor.isClient ) {
  Meteor.startup(function (){
    Session.set('keywords', '');
  })

  // Roda de novo sempre que as palavras chaves mudarem
  Deps.autorun(function () {
    // busca de artigos que contenham as palavras chave
    Meteor.subscribe('searchArticles', Session.get('keywords'));
  });

  Template.results.articles = function () {
    return Articles.find();
  }

  Template.search.events = {

    // A cada 500 milisegundos depois que o usuário digitar algo, setar
    // as palavras chave como o valor definido no campo de busca.
    // Ignorar buscas com menos de 3 letras.
    'keyup input': function (e) {
      recent_changed = true;
      keywords = e.currentTarget.value;
      delay(500, function () {
        if ( keywords.length >= 3 ) {
          Session.set('keywords', keywords);
        } else {
          Session.set('keywords', '');
        }
      });
    }
  }

  // Função básica de delay que espera X segundos antes de executar a função definida em callback.
  // Pode usar jquery debounce ou throttle ao invés disso
  var timer;
  function delay(ms, callback) {
    clearTimeout(timer);
    timer = setTimeout(callback, ms);
  }

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
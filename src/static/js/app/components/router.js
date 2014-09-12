/** @jsx React.DOM */

var $ = require('jquery')

var Backbone = require('backbone')
var _ = require('underscore')
var React = require('react')
var Flasher = require('./flash.js')
var marked = require('marked')

window.$ = Backbone.$ = $;

// Set up marker

var renderer = new marked.Renderer()
renderer.codespan = function (html) { // Don't consider codespans in markdown (they're actually 'latex')
	return '`'+html+'`';
}
marked.setOptions({ renderer: renderer })

/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
// Cookies util

function createCookie(name, value, days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = '; expires='+date.toGMTString();
	}
	else var expires = '';
	document.cookie = name+'='+value+expires+'; path=/';
}

function readCookie(name) {
	var nameEQ = name + '=';
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function eraseCookie(name) {
	createCookie(name,'',-1);
}

/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
// Backbone

var ProblemItem = Backbone.Model.extend({
	url: function () {
		return this.get('apiPath');
	},
	initialize: function () {
	},
});

var ProblemSet = Backbone.Model.extend({
	url: function () {
		return this.get('apiPath');
	},

	initialize: function () {
		this.problems = this.get('docs') || [];
	},
});

var ProblemList = Backbone.Collection.extend({
	model: ProblemItem,
});

var MoveItem = Backbone.Model.extend({
});

var PlayList = Backbone.Collection.extend({
	model: MoveItem,
});

/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
// React

// Backbone mixin, that listens for changes in the model.
var backboneModel = {
	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}
		this.props.model.on('add reset remove change', update.bind(this));
	},
};

var ProblemForm = React.createClass({displayName: 'ProblemForm',
	mixins: [backboneModel],

	onClickSave: function (evt) {
		evt.preventDefault();

		this.props.model.set('topic', this.refs.topicSelect.getDOMNode().value);
		// this.props.model.set('subject', this.refs.subjectSelect.getDOMNode().value);
		this.props.model.attributes.content.body = this.refs.bodyTextarea.getDOMNode().value;
		this.props.model.attributes.content.answer = this.refs.answerInput.getDOMNode().value;
		this.props.model.attributes.content.solution = this.refs.solutionTextarea.getDOMNode().value;
		this.props.model.attributes.content.source = this.refs.sourceInput.getDOMNode().value;
		this.props.model.attributes.content.image = this.refs.bodyimgInput.getDOMNode().value;
		this.props.model.attributes.content.solimg = this.refs.solimgInput.getDOMNode().value;

		var self = this;
		var url = this.props.model.get('id')?
			this.props.model.url():
			('/api/sets/'+this.props.model.get('pset')+'/problems');
		this.props.model.save(undefined, {
			url: url,
			success: function (model) {
				app.flash.info("Problema salvo! :)");
				self.close();
			},
			error: function (model, xhr, options) {
				var data = xhr.responseJSON;
				if (data && data.message) {
					app.flash.alert(data.message);
				} else {
					app.flash.alert('Milton Friedman.');
				}
			}
		});
	},

	close: function () {
		this.props.page.destroy();
	},

	componentDidMount: function () {
		// Close when user clicks directly on element (meaning the faded black background)
		var self = this;
		_.defer(function () {
			$(this.getDOMNode()).find('textarea').autosize();
		}.bind(this));
		$(this.getDOMNode().parentElement).on('click', function onClickOut (e) {
			if (e.target === this || e.target === self.getDOMNode()) {
				self.close();
				$(this).unbind('click', onClickOut);
			}
		});
	},

	render: function () {
		var doc = this.props.model.attributes;
		console.log(this.props.model.url(), this.props.model.get('id'))

		return (
			React.DOM.div( {className:"box"}, 
				React.DOM.i( {className:"close-btn", 'data-action':"close-page", onClick:this.close}),
				React.DOM.form( {className:"form-horizontal", role:"form"}, 
					React.DOM.h3(null, "Editando Problema"),
					React.DOM.div( {className:"form-group"}, 
						React.DOM.label( {className:"col-sm-4 control-label"}, "Tópico"),
						React.DOM.div( {className:"col-sm-8"}, 
							React.DOM.select( {ref:"topicSelect", name:"topic", defaultValue: doc.topic }, 
								React.DOM.option( {value:"combinatorics"}, "Combinatória"),
								React.DOM.option( {value:"number-theory"}, "Teoria dos Números"),
								React.DOM.option( {value:"algebra"}, "Algebra"),
								React.DOM.option( {value:"geometry"}, "Geometria")
							)
						)
					),
					React.DOM.div( {className:"form-group"}, 
						React.DOM.label( {className:"col-sm-4 control-label"}, "Corpo do Problema"),
						React.DOM.div( {className:"col-sm-8"}, 
							React.DOM.textarea( {className:"solution form-control", ref:"bodyTextarea",
								style: {height: '50px'}, 
								name:"solution", defaultValue: doc.content.body, 
								placeholder:"Solução"})
						)
					),
					React.DOM.div( {className:"form-group"}, 
						React.DOM.label( {className:"col-sm-4 control-label"}, "Gabarito"),
						React.DOM.div( {className:"col-sm-8"}, 
							React.DOM.input( {type:"text", className:"form-control", ref:"answerInput",
								placeholder:"Um Número Inteiro",
								defaultValue: doc.content.answer } )
						)
					),
					React.DOM.div( {className:"form-group"}, 
						React.DOM.label( {className:"col-sm-4 control-label"}, "Desenvolvimento da Resolução"),
						React.DOM.div( {className:"col-sm-8"}, 
							React.DOM.textarea( {className:"solution form-control", ref:"solutionTextarea",
								style: {height: '50px'}, 
								name:"solution", defaultValue: doc.content.solution, 
								placeholder:"Bonitchenho."})
						)
					),
					React.DOM.div( {className:"form-group"}, 
						React.DOM.label( {className:"col-sm-4 control-label"}, "Fonte"),
						React.DOM.div( {className:"col-sm-8"}, 
							React.DOM.input( {type:"text", className:"form-control", ref:"sourceInput",
								placeholder:"Formatadinho?",
								defaultValue: doc.content.source } )
						)
					),
					React.DOM.div( {className:"form-group"}, 
						React.DOM.label( {className:"col-sm-4 control-label"}, "Imagem no Corpo do Problema"),
						React.DOM.div( {className:"col-sm-8"}, 
							React.DOM.input( {type:"text", className:"form-control", ref:"bodyimgInput",
								placeholder:"Uma url",
								defaultValue: doc.content.image } )
						)
					),
					React.DOM.div( {className:"form-group"}, 
						React.DOM.label( {className:"col-sm-4 control-label"}, "Imagem no Corpo da Solução"),
						React.DOM.div( {className:"col-sm-8"}, 
							React.DOM.input( {type:"text", className:"form-control", ref:"solimgInput",
								placeholder:"Uma url",
								defaultValue: doc.content.solimg } )
						)
					),
					React.DOM.button( {type:"submit", onClick:this.onClickSave, className:"btn btn-success"}, "Salvar"),
					React.DOM.button( {type:"submit", onClick:this.onClickDelete, className:"btn btn-danger"}, "Remover")
				)
			)
		);
		// <input type="text" name="opcao_0" value="{{ pproblem.content.answer.options[0] }}" placeholder="Opção CERTA" class="opcao" />
		// <input type="text" name="opcao_1" value="{{ pproblem.content.answer.options[1] }}" placeholder="Opcao 2" class="opcao" />
		// <input type="text" name="opcao_2" value="{{ pproblem.content.answer.options[2] }}" placeholder="Opcao 3" class="opcao" />
		// <input type="text" name="opcao_3" value="{{ pproblem.content.answer.options[3] }}" placeholder="Opcao 4" class="opcao" />
		// <input type="text" name="opcao_4" value="{{ pproblem.content.answer.options[4] }}" placeholder="Opcao 5" class="opcao" />
	}
})

var ProblemView = React.createClass({displayName: 'ProblemView',
	getInitialState: function () {
		return {};
	},
	tryAnswer: function (e) {
		var answer = parseInt(this.refs.answer.getDOMNode().value);

		if (isNaN(answer)) {
			app.flash.warn("Resposta inválida.");
			return;
		}

		console.log("User trying answer", answer, this.props.model.get('apiPath')+'/try')

		$.ajax({
			type: 'post',
			dataType: 'json',
			url: this.props.set.get('apiPath')+'/'+this.props.index+'/try',
			data: { 'try': answer }
		}).done(function (response) {
			if (response.error) {
				app.flash.alert(response.message || 'Erro!');
			} else {
				if (response.correct) {
					app.flash.info('<i class="icon-happy2"></i>')
				} else {
					app.flash.warn('<i class="icon-sad2"></i>')
				}
				if (response.data) {
					this.props.trials.push(response.data);
				}
				this.forceUpdate();
			}
		}.bind(this)).fail(function (xhr) {
			app.flash.alert(xhr.responseJSON && xhr.responseJSON.message || 'Erro!');
			if (xhr.responseJSON && xhr.responseJSON.redirect) {
				var url = xhr.responseJSON.redirect;
				console.log('Redirecting user to '+url);
				app.navigate(url, { trigger: true });
			}
		});
	},

	componentDidUpdate: function () {
		_.defer(function () {
			MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
		});
	},

	componentDidMount: function () {
		_.defer(function () {
			MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
		});
	},

	onClickNext: function () {
		if (this.props.index === this.props.set.get('docs').length-1) { // This was the last one.
			app.navigate(this.props.set.get('path'), { trigger: true });
		} else {
			app.navigate(this.props.set.get('path')+'/'+(this.props.index+1), { trigger: true });
		}
	},

	render: function () {
		var post = this.props.model.attributes;

		var source = post.content.source;
		var isAdaptado = source && (!!source.match(/(^\[adaptado\])|(adaptado)/));


		var trials = this.props.trials.findWhere({ index: this.props.index });
		console.log(trials)
		if (trials) {
			if (trials.get('solved')) {
				var feedback = (
					React.DOM.div(null, 
						React.DOM.i( {className:"icon-check-circle correct"}),
						React.DOM.div( {className:"message"}, 
							"Resposta certa!",
							React.DOM.small(null, "(parabéns)")
						)
					)
				);
			} else {				
				var feedback = (
					React.DOM.div(null, 
						React.DOM.i( {className:"icon-times-circle"}),
						React.DOM.div( {className:"message"}, 
							"Resposta errada."
						)
					)
				);
			}
			var rightCol = (
				React.DOM.div( {className:"right-col"}, 
					React.DOM.div( {className:"curtain"}, 
						feedback,
						React.DOM.button( {className:"next", onClick:this.onClickNext}, 
							"Próxima Questão"
						)
					)
				)
			);
		} else {
			var rightCol = (
				React.DOM.div( {className:"right-col"}, 
					React.DOM.span( {className:"question"}, "Qual é a resposta para o enunciado?"),
					React.DOM.input( {type:"text", ref:"answer", placeholder:"Resultado", className:"answer", name:"answer"}),
					React.DOM.button( {className:"send", onClick:this.tryAnswer}, 
						"Responder"
					),

					React.DOM.button( {className:"skip", onClick:this.onClickNext, 'data-toggle':"tooltip", title:"Você pode voltar a ele depois."}, 
						"Pular Problema"
					)
				)
			);
		}

		var html = marked("<strong>"+(this.props.index+1)+"</strong>. "+post.content.body);
		var source = post.content.source?post.content.source.split(',')[0]:'';

		var labelClass = {'geometry':'info','combinatorics':'warning',
			'algebra':'danger','number-theory':'success'}[post.topic];

		// <img src={post.content.image} />
		return (
			React.DOM.div( {className:"box question-box"}, 
				React.DOM.header(null, 
					React.DOM.div( {className:"breadcrumbs"}, 
						React.DOM.a( {href:"/"}, "Maratonas QI Labs"), " » ",
						React.DOM.a( {href: this.props.set.get('path') }, 
							 this.props.set.get('name') 
						)
					),
					React.DOM.div( {className:"right"}, 
						"Logado como",
						React.DOM.div( {className:"user-avatar"}, 
							React.DOM.div( {className:"avatar", style:{background: 'url('+window.user.avatarUrl+')'}})
						),
						React.DOM.strong(null, 
						React.DOM.span( {className:"username"}, window.user.name),", "
						),
						React.DOM.a( {href:"#", 'data-ajax-post-href':"/api/me/logout", 'data-redirect-href':"/"}, 
							"sair"
						)
					)
				),
				React.DOM.div( {className:"content-col"}, 
					React.DOM.div( {className:"body-window"}, 
						React.DOM.div( {className:"content"}, 
							React.DOM.span( {dangerouslySetInnerHTML:{__html: html}}),
							
								post.content.image?
								React.DOM.img( {src:post.content.image} )
								:null
							
						)
					),
					React.DOM.div( {className:"fixed-footer"}, 
						React.DOM.div( {className:"info source"}, 
							React.DOM.span( {className:"label label-default"}, "Matemática Olímpica"),
							" ",
							React.DOM.span( {className:"label label-"+labelClass}, post.translated_topic), " ", source
						),
						React.DOM.div( {className:"actions"}, 
							React.DOM.a( {target:"_blank", href:"https://docs.google.com/forms/d/1QAkcnK2YPB5SF2f3Ds247aHKVF055bGlo0v-pt7Jn3s/viewform",
								className:"button flag"}, React.DOM.i( {className:"icon-flag"}))
						)
					)
				),
				rightCol
			)
		);
	},
});

var ProblemSetView = React.createClass({displayName: 'ProblemSetView',

	render: function () {
		var icons = {
			'algebra': 'icon-plus-circle',
			'geometry': 'icon-measure',
		}

		if (this.props.collection.length === this.props.trials.length) {
			var counts = this.props.trials.countBy('solved');
			console.log(counts)

			return (
				React.DOM.div( {className:"box"}, 
					React.DOM.header(null, 
						React.DOM.div( {className:"breadcrumbs"}, 
							React.DOM.a( {href:"/"}, "Maratonas QI Labs"), " » ",
							React.DOM.a( {href: this.props.model.get('path') }, 
								React.DOM.strong(null,  this.props.model.get('name') )
							)
						),
						React.DOM.div( {className:"right"}, 
							"Logado como",
							React.DOM.div( {className:"user-avatar"}, 
								React.DOM.div( {className:"avatar", style:{background: 'url('+window.user.avatarUrl+')'}})
							),
							React.DOM.strong(null, 
								React.DOM.span( {className:"username"}, window.user.name),", "
							),
							React.DOM.a( {href:"#", 'data-ajax-post-href':"/api/me/logout", 'data-redirect-href':"/"}, 
								"sair"
							)
						)
					),
				React.DOM.div( {className:"box-fill"}, 
					React.DOM.div( {className:"content-col full finished"}, 
						React.DOM.div( {className:"veil"}, 
							React.DOM.i( {className:"icon-happy2"}),
							React.DOM.h1(null, React.DOM.strong(null, "Você concluiu o aquecimento.")),

							React.DOM.div( {className:"feedback"}, 
								React.DOM.h2(null, React.DOM.strong(null, "Sua pontuação final: ", counts[true] || 0,"/",this.props.trials.length))
							),
							React.DOM.p(null
							)
						),

						React.DOM.div( {className:"btn-group"}, 
							React.DOM.button( {className:"share-fb"}, 
								"Compartilhe no Facebook"
							),
							React.DOM.a( {href:"http://qilabs.org", className:"button sign-beta"}, 
								"Inscreva-se para o QI Labs Beta"
							),
							React.DOM.a( {href:"https://docs.google.com/forms/d/1JeGj4tXNxmjubnTK4GF8JqFu9_hnkk4EK_1ZZAgzf5I/viewform", className:"button tell-us"}, 
								"Conte-nos o que voce achou :)"
							)
						)
					)
				)
				)
			);
		};

		var problems = this.props.collection.map(function (problem, i) {
			var trial = this.props.trials.findWhere({ index: i });
			var solved = (trial && trial.get('solved')) || false;
			var path = this.props.model.get('path')+'/'+i;
			function gotoProblem() {
				app.navigate(path, { trigger: true });
			}
			return (
				React.DOM.div( {key:problem.id, className:"item", 'data-solved':solved}, 
					React.DOM.button( {className:"", onClick:gotoProblem}, 
						"Problema ", i+1,
						
							trial?
							React.DOM.i( {className:"indicator "+(solved?"icon-tick":"icon-times")})
							:null
						
					)
				)
			)
		}.bind(this));

		var numSolved = _.countBy(window.set.moves, 'solved').true;

		return (
			React.DOM.div( {className:"box pset-box"}, 
				React.DOM.header(null, 
					React.DOM.div( {className:"breadcrumbs"}, 
						React.DOM.a( {href:"/"}, "Maratonas QI Labs"), " » ",
						React.DOM.a( {href: this.props.model.get('path') }, 
							React.DOM.strong(null,  this.props.model.get('name') )
						)
					),
					React.DOM.div( {className:"right"}, 
						"Logado como",
						React.DOM.div( {className:"user-avatar"}, 
							React.DOM.div( {className:"avatar", style:{background: 'url('+window.user.avatarUrl+')'}})
						),
						React.DOM.strong(null, 
							React.DOM.span( {className:"username"}, window.user.name),", "
						),
						React.DOM.a( {href:"#", 'data-ajax-post-href':"/api/me/logout", 'data-redirect-href':"/"}, 
							"sair"
						)
					)
				),
				React.DOM.div( {className:"content-col"}, 
					React.DOM.h1(null),
					"Problemas Resolvidos: ",  this.props.model.get('moves').length, "/", this.props.collection.length, 
					React.DOM.div( {className:"contributors"}, 
						React.DOM.label(null, "Contribuidores:"),
						React.DOM.div( {className:"user-avatar"}, 
							React.DOM.div( {className:"avatar", style:{background: 'url(https://graph.facebook.com/100002970450567/picture?width=200&height=200)'}})
						),
						React.DOM.div( {className:"user-avatar"}, 
							React.DOM.div( {className:"avatar", style:{background: 'url(https://graph.facebook.com/100002234680040/picture?width=200&height=200)'}})
						),
						React.DOM.div( {className:"user-avatar", 'data-toogle':"tooltip", title:"Luiz Fernando Leal"}, 
							React.DOM.div( {className:"avatar", style:{background: 'url(https://graph.facebook.com/100001334209362/picture?width=200&height=200)'}})
						)
					)
				),
				React.DOM.div( {className:"right-col"}, 
					React.DOM.ul( {className:"problem-list"}, 
						problems
					)
				)
			)
		);
	},
});

/////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
// Router stuff

var Page = function (component, dataPage, opts) {

	var opts = _.extend({}, opts || {
		onClose: function () {}
	});

	component.props.page = this;
	var e = document.createElement('div');
	this.e = e;
	this.c = component;
	if (!opts.navbar)
		$(e).addClass('pContainer');
	$(e).addClass((opts && opts.class) || '');
	$(e).addClass('invisible').hide().appendTo('body');
	if (dataPage)
		e.dataset.page = dataPage;
	var oldTitle = document.title;
	if (opts.title) {
		document.title = opts.title;
	}
	$('html').addClass(opts.crop?'crop':'place-crop');

	React.renderComponent(component, e, function () {
		$(e).show().removeClass('invisible');
	});

	this.destroy = function (navigate) {
		$(e).addClass('invisible');
		React.unmountComponentAtNode(e);
		$(e).remove();
		document.title = oldTitle;
		$('html').removeClass(opts.crop?'crop':'place-crop');
		if (opts.onClose) {
			opts.onClose();
			opts.onClose = undefined; // Prevent calling twice
		}
	};
};

// Central functionality of the app.
var WorkspaceRouter = Backbone.Router.extend({
	initialize: function () {
		console.log('initialized')
		this.pages = [];
		this.route('panel', this.setUpPanel.bind(this));
		this.route('panel/sets/:pset', this.setUpPanel.bind(this));
	},

	flash: new Flasher,

	setUpPanel: function () {
		console.log('Setting up panel forms.')
		if ($(".teste-latex")[0]) {
			$(".teste-latex").on('submit', function (e) {
				e.preventDefault();
				$(this).find('.output').html($(this).find('textarea').val());
				MathJax.Hub.Queue(['Typeset',MathJax.Hub]);
			});
		}
		if ($(".set-form")[0]) {
			$(".set-form").on('submit', function (e) {
				e.preventDefault();
				$.ajax({
					type: 'post',
					dataType: 'json'
,					url: $(this).attr('action'),
					data: {
						name: $(this).find('[name=name]').val(),
					}
				}).done(function (response) {
					location.reload();
				});
			});
		}
	},

	triggerComponent: function (comp, args) {
		comp.call(this, args);
	},

	closePages: function () {
		for (var i=0; i<this.pages.length; i++) {
			this.pages[i].destroy();
		}
		this.pages = [];
	},

	routes: {
		'p/:pset':
			function (pset) {
				this.pset = new ProblemSet(window.set);
				this.psetCollection = new ProblemList(window.set.docs);
				this.moves = new PlayList(window.set.moves);
				React.renderComponent(ProblemSetView( {trials:this.moves, model:this.pset, collection:this.psetCollection} ),
					document.querySelector("#box-wrapper"),
					function(){});
			},
		'p/:psetSlug/:num':
			function (psetSlug, num) {
				this.closePages();
				if (!this.pset) {
					this.pset = new ProblemSet(window.set);
					this.psetCollection = new ProblemList(window.set.docs);
					this.moves = new PlayList(window.set.moves);
				}
				if (!isNaN(parseInt(num))) {
					this.triggerComponent(this.components['view-problem'], {
						psetSlug: psetSlug,
						num: parseInt(num)
					});
					_.defer(function () {
						MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
					});
					return;
				}
				console.warn('Invalid problem index.');
			},
	},

	components: {
		'create-problem': function (data) {
			this.closePages();

			var problemItem = new ProblemItem({ pset: data.pset, content: {} });
			
			var p = new Page(ProblemForm( {model:problemItem} ), 'problem-form', {
				title: "Criando novo problema.",
				crop: true,
				onClose: function () {
					// app.navigate('/');
				}
			});
			this.pages.push(p);
		},
		'edit-problem': function (data) {
			this.closePages();

			$.getJSON('/api/sets/'+data.pset+'/problems/'+data.id)
				.done(function (response) {
					var problemItem = new ProblemItem(response.data);
					var p = new Page(ProblemForm( {model:problemItem} ), 'problem-form', {
						title: "Editando problema.",
						crop: true,
						onClose: function () {
							// app.navigate('/');
						}
					});
					this.pages.push(p);
				}.bind(this));
		},
		'view-problem': function (data) {
			if (!window.set || !window.set.docs) {
				app.flash.alert("Erro. Conjunto de problemas não encontrado.")
				return;
			}
			if (!this.psetCollection) {
				app.flash.warn("Coleção de problemas não encontrada..")
				return;
			}
			if (this.psetCollection.size() <= data.num) {
				app.flash.warn("Problema não encontrado.")
				return;
			}

			var postItem = this.psetCollection.at(data.num);

			console.log(this.moves)
			React.renderComponent(ProblemView( {trials:this.moves, set:this.pset, index:data.num, model:postItem} ),
				document.querySelector("#box-wrapper"),
				function(){});
			
			// var set = new ProblemSet(window.set);
			// $.getJSON('/api/sets/'+set.id+'/'+data.num)
			// 	.done(function (response) {
			// 		if (response.data) {
			// 			console.log(response.data)
			// 		}
			// 	}.bind(this))
			// 	.fail(function (response) {
			// 		alert('Ops! Não conseguimos encontrar esse problema. Ele pode ter sido excluído.');
			// 	}.bind(this));
		},
	},
});

module.exports = {
	initialize: function () {
		window.app = new WorkspaceRouter;
		// Backbone.history.start({ pushState:false, hashChange:true });
		Backbone.history.start({ pushState:true, hashChange: false });
	},
};
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

var ProblemForm = React.createClass({
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
			<div className="box">
				<i className='close-btn' data-action='close-page' onClick={this.close}></i>
				<form className="form-horizontal" role="form">
					<h3>Editando Problema</h3>
					<div className="form-group">
						<label className="col-sm-4 control-label">Tópico</label>
						<div className="col-sm-8">
							<select ref="topicSelect" name="topic" defaultValue={ doc.topic }>
								<option value="combinatorics">Combinatória</option>
								<option value="number-theory">Teoria dos Números</option>
								<option value="algebra">Algebra</option>
								<option value="geometry">Geometria</option>
							</select>
						</div>
					</div>
					<div className="form-group">
						<label className="col-sm-4 control-label">Corpo do Problema</label>
						<div className="col-sm-8">
							<textarea className="solution form-control" ref="bodyTextarea"
								style={ {height: '50px'} }
								name="solution" defaultValue={ doc.content.body }
								placeholder="Solução"></textarea>
						</div>
					</div>
					<div className="form-group">
						<label className="col-sm-4 control-label">Gabarito</label>
						<div className="col-sm-8">
							<input type="text" className="form-control" ref="answerInput"
								placeholder="Um Número Inteiro"
								defaultValue={ doc.content.answer } />
						</div>
					</div>
					<div className="form-group">
						<label className="col-sm-4 control-label">Desenvolvimento da Resolução</label>
						<div className="col-sm-8">
							<textarea className="solution form-control" ref="solutionTextarea"
								style={ {height: '50px'} }
								name="solution" defaultValue={ doc.content.solution }
								placeholder="Bonitchenho."></textarea>
						</div>
					</div>
					<div className="form-group">
						<label className="col-sm-4 control-label">Fonte</label>
						<div className="col-sm-8">
							<input type="text" className="form-control" ref="sourceInput"
								placeholder="Formatadinho?"
								defaultValue={ doc.content.source } />
						</div>
					</div>
					<div className="form-group">
						<label className="col-sm-4 control-label">Imagem no Corpo do Problema</label>
						<div className="col-sm-8">
							<input type="text" className="form-control" ref="bodyimgInput"
								placeholder="Uma url"
								defaultValue={ doc.content.image } />
						</div>
					</div>
					<div className="form-group">
						<label className="col-sm-4 control-label">Imagem no Corpo da Solução</label>
						<div className="col-sm-8">
							<input type="text" className="form-control" ref="solimgInput"
								placeholder="Uma url"
								defaultValue={ doc.content.solimg } />
						</div>
					</div>
					<button type="submit" onClick={this.onClickSave} className="btn btn-success">Salvar</button>
					<button type="submit" onClick={this.onClickDelete} className="btn btn-danger">Remover</button>
				</form>
			</div>
		);
		// <input type="text" name="opcao_0" value="{{ pproblem.content.answer.options[0] }}" placeholder="Opção CERTA" class="opcao" />
		// <input type="text" name="opcao_1" value="{{ pproblem.content.answer.options[1] }}" placeholder="Opcao 2" class="opcao" />
		// <input type="text" name="opcao_2" value="{{ pproblem.content.answer.options[2] }}" placeholder="Opcao 3" class="opcao" />
		// <input type="text" name="opcao_3" value="{{ pproblem.content.answer.options[3] }}" placeholder="Opcao 4" class="opcao" />
		// <input type="text" name="opcao_4" value="{{ pproblem.content.answer.options[4] }}" placeholder="Opcao 5" class="opcao" />
	}
})

var ProblemView = React.createClass({
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
			location.href = this.props.set.get('path'); // , { trigger: true });

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
					<div>
						<i className="icon-check-circle correct"></i>
						<div className="message">
							Resposta certa!
							<small>(parabéns)</small>
						</div>
					</div>
				);
			} else {				
				var feedback = (
					<div>
						<i className="icon-times-circle"></i>
						<div className="message">
							Resposta errada.
						</div>
					</div>
				);
			}
			var rightCol = (
				<div className="right-col">
					<div className="curtain">
						{feedback}
						<button className="next" onClick={this.onClickNext}>
							Próxima Questão
						</button>
					</div>
				</div>
			);
		} else {
			var rightCol = (
				<div className="right-col">
					<span className="question">Qual é a resposta para o enunciado?</span>
					<input type="text" ref="answer" placeholder="Resultado" className="answer" name="answer"/>
					<button className="send" onClick={this.tryAnswer}>
						Responder
					</button>

					<button className="skip" onClick={this.onClickNext} data-toggle="tooltip" title="Você pode voltar a ele depois.">
						Pular Problema
					</button>
				</div>
			);
		}

		var html = marked("<strong>"+(this.props.index+1)+"</strong>. "+post.content.body);
		var source = post.content.source?post.content.source.split(',')[0]:'';

		var labelClass = {'geometry':'info','combinatorics':'warning',
			'algebra':'danger','number-theory':'success'}[post.topic];

		// <img src={post.content.image} />
		return (
			<div className="box question-box">
				<header>
					<div className="breadcrumbs">
						<a href="/">Maratonas QI Labs</a> &raquo;&nbsp;
						<a href={ this.props.set.get('path') }>
							{ this.props.set.get('name') }
						</a>
					</div>
					<div className="right">
						Logado como
						<div className="user-avatar">
							<div className="avatar" style={{background: 'url('+window.user.avatarUrl+')'}}></div>
						</div>
						<strong>
						<span className="username">{window.user.name}</span>,&nbsp;
						</strong>
						<a href="#" data-ajax-post-href="/api/me/logout" data-redirect-href="/">
							sair
						</a>
					</div>
				</header>
				<div className="content-col">
					<div className="body-window">
						<div className="content">
							<span dangerouslySetInnerHTML={{__html: html}}></span>
							{
								post.content.image?
								<img src={post.content.image} />
								:null
							}
						</div>
					</div>
					<div className="fixed-footer">
						<div className="info source">
							<span className="label label-default">Matemática Olímpica</span>
							&nbsp;
							<span className={"label label-"+labelClass}>{post.translated_topic}</span> {source}
						</div>
						<div className="actions">
							<a target="_blank" href="https://docs.google.com/forms/d/1QAkcnK2YPB5SF2f3Ds247aHKVF055bGlo0v-pt7Jn3s/viewform"
								className="button flag"><i className="icon-flag"></i></a>
						</div>
					</div>
				</div>
				{rightCol}
			</div>
		);
	},
});

var ProblemSetView = React.createClass({

	shareOnFacebook: function () {
		FB.api(
		'me/qilabsdotorg:solve',
		'post',
		{
			simulado: "http://maratona.qilabs.org/opg/"+this.props.model.get('id'),
			access_token: window.user.access_token
		},
		function(response) {
			console.log(response)
			if (response.error) {
				app.flash.warn("Ops. Detectamos um erro, mas é provavelmente falha nossa.");
			} else {
				app.flash.info("Postado no seu mural com sucesso.");
			}
		}
		);
	},

	render: function () {
		var icons = {
			'algebra': 'icon-plus-circle',
			'geometry': 'icon-measure',
		}

		if (this.props.collection.length === this.props.trials.length) {
			var counts = this.props.trials.countBy('solved');
			console.log(counts)

			return (
				<div className="box">
					<header>
						<div className="breadcrumbs">
							<a href="/">Maratonas QI Labs</a> &raquo;&nbsp;
							<a href={ this.props.model.get('path') }>
								<strong>{ this.props.model.get('name') }</strong>
							</a>
						</div>
						<div className="right">
							Logado como
							<div className="user-avatar">
								<div className="avatar" style={{background: 'url('+window.user.avatarUrl+')'}}></div>
							</div>
							<strong>
								<span className="username">{window.user.name}</span>,&nbsp;
							</strong>
							<a href="#" data-ajax-post-href="/api/me/logout" data-redirect-href="/">
								sair
							</a>
						</div>
					</header>
				<div className="box-fill">
					<div className="content-col full finished">
						<div className="veil">
							<i className="icon-happy2"></i>
							<h1><strong>Você concluiu o aquecimento.</strong></h1>

							<div className="feedback">
								<h2><strong>Sua pontuação final: {counts[true] || 0}/{this.props.trials.length}</strong></h2>
							</div>
							<p className="lead">
								O gabarito será divulgado nos próximos dias.
							</p>
						</div>

						<div className="btn-group">
							<button className="share-fb" onClick={this.shareOnFacebook}>
								Compartilhe no Facebook
							</button>
							<a href="http://qilabs.org" className="button sign-beta">
								Inscreva-se para o QI Labs Beta
							</a>
							<a href="https://docs.google.com/forms/d/1JeGj4tXNxmjubnTK4GF8JqFu9_hnkk4EK_1ZZAgzf5I/viewform" className="button tell-us">
								Conte-nos o que voce achou :)
							</a>
						</div>
					</div>
				</div>
				</div>
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
				<div key={problem.id} className="item" data-solved={solved}>
					<button className="" onClick={gotoProblem}>
						Problema {i+1}
						{
							trial?
							<i className={"indicator "+(solved?"icon-tick":"icon-times")}></i>
							:null
						}
					</button>
				</div>
			)
		}.bind(this));

		var numSolved = _.countBy(window.set.moves, 'solved').true;

		return (
			<div className="box pset-box">
				<header>
					<div className="breadcrumbs">
						<a href="/">Maratonas QI Labs</a> &raquo;&nbsp;
						<a href={ this.props.model.get('path') }>
							<strong>{ this.props.model.get('name') }</strong>
						</a>
					</div>
					<div className="right">
						Logado como
						<div className="user-avatar">
							<div className="avatar" style={{background: 'url('+window.user.avatarUrl+')'}}></div>
						</div>
						<strong>
							<span className="username">{window.user.name}</span>,&nbsp;
						</strong>
						<a href="#" data-ajax-post-href="/api/me/logout" data-redirect-href="/">
							sair
						</a>
					</div>
				</header>
				<div className="content-col">
					<h1>{ this.props.model.get('name') }</h1>
					<p className="lead">
						Esse simulado é composto por { this.props.collection.length } questões de matemática, abordando conhecimento em: <span className="label label-info">geometria</span>, <span className="label label-success">teoria dos números</span>, <span className="label label-warning">análise combinatória</span> e <span className="label label-danger">álgebra</span>. 
					</p>
					<h3>Boa sorte!</h3>
					<div className="contributors">
						<label>Banca:</label>
						<a href="http://qilabs.org/@franco.severo.7">
							<div className="user-avatar" data-toggle="tooltip" title="Franco Severo, IMPA"
								data-container="body" data-placement="bottom">
								<div className="avatar" style={{background: 'url(https://graph.facebook.com/100002970450567/picture?width=200&height=200)'}}></div>
							</div>
						</a>
						<a href="http://qilabs.org/@michelle.malher">
							<div className="user-avatar" data-toggle="tooltip" title="Michelle Malher, QI Labs"
								data-container="body" data-placement="bottom">
								<div className="avatar" style={{background: 'url(https://graph.facebook.com/100002234680040/picture?width=200&height=200)'}}></div>
							</div>
						</a>
						<a href="http://qilabs.org/@luizfernando.gomes.581">
							<div className="user-avatar" data-toggle="tooltip" title="Luiz Fernando Leal, QI Labs"
								data-container="body" data-placement="bottom">
								<div className="avatar" style={{background: 'url(https://graph.facebook.com/100001334209362/picture?width=200&height=200)'}}></div>
							</div>
						</a>
						<a href="http://qilabs.org/@felipearagaopires">
							<div className="user-avatar" data-toggle="tooltip" title="Felipe Aragão Pires, QI Labs"
								data-container="body" data-placement="bottom">
								<div className="avatar" style={{background: 'url(http://i.imgur.com/nXb8vMd.png)'}}></div>
							</div>
						</a>
					</div>
				</div>
				<div className="right-col">
					<ul className="problem-list">
						{problems}
					</ul>
				</div>
			</div>
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
				React.renderComponent(<ProblemSetView trials={this.moves} model={this.pset} collection={this.psetCollection} />,
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
			
			var p = new Page(<ProblemForm model={problemItem} />, 'problem-form', {
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
					var p = new Page(<ProblemForm model={problemItem} />, 'problem-form', {
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

			$.get('/api/sets/'+data.psetSlug+'/'+data.num);
			console.log(this.moves)
			React.renderComponent(<ProblemView trials={this.moves} set={this.pset} index={data.num} model={postItem} />,
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
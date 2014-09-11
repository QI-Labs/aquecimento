/** @jsx React.DOM */

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


var backboneModel = {
	componentWillMount: function () {
		var update = function () {
			this.forceUpdate(function(){});
		}
		this.props.model.on('add reset remove change', update.bind(this));
	},
};


window.$ = require('jquery')
var Backbone = require('backbone')
var _ = require('underscore')
var React = require('react')

var Flasher = require('./flash.js')
Backbone.$ = window.$;

marked = require('marked');
var renderer = new marked.Renderer();
renderer.codespan = function (html) {
	// Don't consider codespans in markdown (they're actually 'latex')
	return '`'+html+'`';
}
marked.setOptions({
	renderer: renderer
})

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
		this.props.model.save(undefined, {
			url: this.props.model.url() || ('/api/sets/'+this.props.model.get('pset')+'/problems'),
			success: function (model) {
				// window.location.href = model.get('editorPath');
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
		$(this.getDOMNode().parentElement).on('click', function onClickOut (e) {
			if (e.target === this || e.target === self.getDOMNode()) {
				self.close();
				$(this).unbind('click', onClickOut);
			}
		});
	},

	render: function () {
		var doc = this.props.model.attributes;

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
	tryAnswer: function (e) {
		var index = parseInt(e.target.dataset.index);

		console.log("User clicked", index, this.props.model.get('apiPath')+'/try')

		$.ajax({
			type: 'post',
			dataType: 'json',
			url: this.props.model.get('apiPath')+'/try',
			data: { test: index }
		}).done(function (response) {
			if (response.error) {
				alert(response.message || 'Erro!');
			} else {
				if (response.result) {
					app.flash.info("Because you know me so well.");
				} else {
					app.flash.info("WROOOOOOOOOONNNG, YOU IMBECILE!");
				}
			}
		}).fail(function (xhr) {
			alert(xhr.responseJSON && xhr.responseJSON.message || 'Erro!');
		});
	},

	componentDidMount: function () {
		MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
	},

	render: function () {
		var post = this.props.model.attributes;

		var source = post.content.source;
		var isAdaptado = source && (!!source.match(/(^\[adaptado\])|(adaptado)/));

		var html = marked(post.content.body);

		var level = "3";
		var number = 5;
		var total = 10;

		// <img src={post.content.image} />
		return (
			<div className="question-box">
				<header>
					<div className="breadcrumbs">
						Maratona OBM &raquo; Nível {post.level} &raquo; <a href={"/#"+post.topic}>#{post.translated_topic}</a>
					</div>
					<div className="right">
						Logado como <span className="username">{window.user.name}</span>,&nbsp;
						<a href="#" data-ajax-post-href="/api/me/logout" data-redirect-href="/">
							sair
						</a>
					</div>
				</header>
				<div className="content-col">
					<div className="body-window">
						<div className="content">
						<span dangerouslySetInnerHTML={{__html: html}}></span>
						</div>
					</div>
					<div className="fixed-footer">
						<div className="info source">
							{source?source:null}
						</div>
						<div className="actions">
							<button className="info"><i className="icon-info"></i></button>
							<button className="flag"><i className="icon-flag"></i></button>
						</div>
					</div>
				</div>
				<div className="right-col">
					<span className="question">Qual é a resposta para o enunciado?</span>
					<input type="text" ref="answer" placeholder="Resultado" className="answer" name="answer"/>
					<button className="send">
						Responder
					</button>

					<button className="skip">
						Pular Problema
					</button>
				</div>
			</div>
		);
	},
});

// setTimeout(function updateCounters () {
// 	$('[data-time-count]').each(function () {
// 		this.innerHTML = calcTimeFrom(parseInt(this.dataset.timeCount), this.dataset.timeLong);
// 	});
// 	setTimeout(updateCounters, 1000);
// }, 1000);

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

var ProblemItem = Backbone.Model.extend({
	url: function () {
		return this.get('apiPath');
	},

	initialize: function () {
		var children = this.get('children') || [];
	},
});

var ProblemList = Backbone.Collection.extend({
	model: ProblemItem,
});

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
			dataType: 'json',
			url: $(this).attr('action'),
			data: {
				name: $(this).find('[name=name]').val(),
			}
		}).done(function (response) {
			location.reload();
		});
	});
}

// Central functionality of the app.
var WorkspaceRouter = Backbone.Router.extend({
	initialize: function () {
		console.log('initialized')
		this.pages = [];
	},

	flash: new Flasher,

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
		'panel':
			function () {
			},
		'p/:pset/:num':
			function (pset, num) {
				if (!isNaN(parseInt(num)))
					this.triggerComponent(this.components['view-problem'], {pset:pset, num:num})
			}
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
			$.getJSON('/api/sets/'+data.pset+'/'+data.num)
				.done(function (response) {
					var postItem = new ProblemItem(response.data);
					React.renderComponent(<ProblemView type="Problem" model={postItem} />,
						document.querySelector("#problem-wrapper"),
						function(){});
				}.bind(this))
				.fail(function (response) {
					alert('Ops! Não conseguimos encontrar esse problema. Ele pode ter sido excluído.');
				}.bind(this));
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
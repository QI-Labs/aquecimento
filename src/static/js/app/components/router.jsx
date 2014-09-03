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

window.$ = require('jquery')
var Backbone = require('backbone')
var _ = require('underscore')
var React = require('react')

var Flasher = require('./flash.js')
Backbone.$ = window.$

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
				app.flash.alert(response.message || 'Erro!');
			} else {
				if (response.result) {
					app.flash.info("Because you know me so well.");
				} else {
					app.flash.info("WROOOOOOOOOONNNG, YOU IMBECILE!");
				}
			}
		}).fail(function (xhr) {
			app.flash.alert(xhr.responseJSON && xhr.responseJSON.message || 'Erro!');
		});
	},

	render: function () {
		var post = this.props.model.attributes;
		var userIsAuthor = window.user && post.author.id===window.user.id;

		// if window.user.id in this.props.model.get('hasSeenAnswer'), show answers
		console.log(post.content.answer);
		var source = post.content.source;
		var isAdaptado = source && (!!source.match(/(^\[adaptado\])|(adaptado)/));

		var rightCol;
		if (userIsAuthor) {
			rightCol = (
				<div className="rightCol alternative">
					<h3>Você criou esse problema.</h3>
				</div>
			)
		} else if (post._meta && post._meta.userAnswered) {
			rightCol = (
				<div className="rightCol alternative">
					<h3>Você respondeu essa pergunta.</h3>
				</div>
			);
		} else {
			rightCol = (
				<div className="rightCol">
					<div className="answer-col-mc">
						<ul>
							<li>
								<button onClick={this.tryAnswer} data-index="0" className="right-ans">{post.content.answer.options[0]}</button>
							</li>
							<li>
								<button onClick={this.tryAnswer} data-index="1" className="wrong-ans">{post.content.answer.options[1]}</button>
							</li>
							<li>
								<button onClick={this.tryAnswer} data-index="2" className="wrong-ans">{post.content.answer.options[2]}</button>
							</li>
							<li>
								<button onClick={this.tryAnswer} data-index="3" className="wrong-ans">{post.content.answer.options[3]}</button>
							</li>
							<li>
								<button onClick={this.tryAnswer} data-index="4" className="wrong-ans">{post.content.answer.options[4]}</button>
							</li>
						</ul>
					</div>
				</div>
			);
		}

						// <time>
						// 	&nbsp;publicado&nbsp;
						// 	<span data-time-count={1*new Date(post.created_at)}>
						// 		{window.calcTimeFrom(post.created_at)}
						// 	</span>
						// 	{(post.updated_at && 1*new Date(post.updated_at) > 1*new Date(post.created_at))?
						// 		(<span>
						// 			,&nbsp;<span data-toggle="tooltip" title={window.calcTimeFrom(post.updated_at)}>editado</span>
						// 		</span>
						// 		)
						// 		:null
						// 	}
						// </time>

		return (
			<div className="postCol question">
				<div className="contentCol">
					<div className="body-window">
						<div className="breadcrumbs">
						</div>
						<div className="body-window-content">
							<div className="title">
								{post.content.title}
							</div>
							<div className="postBody" dangerouslySetInnerHTML={{__html: this.props.model.get('content').body}}></div>
						</div>
						<div className="sauce">
							{isAdaptado?<span className="detail">adaptado</span>:null}
							{source?source:null}
						</div>
					</div>
					<div className="fixed-footer">
						<div className="user-avatar">
							<div className="avatar" style={ { background: 'url('+post.author.avatarUrl+')' } }></div>
						</div>
						<div className="info">
							Por <a href={post.author.path}>{post.author.name}</a>, 14 anos, Brazil
						</div>
						<div className="actions">
							<button className=""><i className="icon-thumbsup"></i> 23</button>
							<button className=""><i className="icon-retweet2"></i> 5</button>
						</div>
					</div>
				</div>
				{rightCol}
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

var ProblemItem = Backbone.Model.extend({
	url: function () {
		return this.get('apiPath');
	},

	handleToggleVote: function () {
		var self = this;
		$.ajax({
			type: 'post',
			dataType: 'json',
			url: this.get('apiPath')+(this.liked?'/unupvote':'/upvote'),
		}).done(function (response) {
			console.log('response', response);
			if (!response.error) {
				self.liked = !self.liked;
				if (response.data.author) {
					delete response.data.author;
				}
				self.set(response.data);
				self.trigger('change');
			}
		});
	},

	initialize: function () {
		var children = this.get('children') || [];
		this.answers = new ChildrenCollections.Answer(children.Answer);
	},
});
// Central functionality of the app.
var WorkspaceRouter = Backbone.Router.extend({
	initialize: function () {
		console.log('initialized')
	},

	flash: new Flasher,

	triggerComponent: function (comp, args) {
		comp.call(this, args);
	},

	routes: {
		'problems/:problemId':
			function (problemId) {
				this.triggerComponent(this.components.viewProblem,{id:problemId});
			},
	},

	components: {
		viewProblem: function (data) {
			this.closePages();
			var postId = data.id;
			$.getJSON('/api/problems/'+postId)
				.done(function (response) {
					if (response.data.parent) {
						return app.navigate('/problems/'+response.data.parent, {trigger:true});
					}
					console.log('response, data', response);
					var postItem = new models.problemItem(response.data);
					var p = new Page(<FullItem type="Problem" model={postItem} />, 'post', {
						title: postItem.get('content').title,
						crop: true,
						onClose: function () {
							window.history.back();
						}
					});
					this.pages.push(p);
				}.bind(this))
				.fail(function (response) {
					app.flash.alert('Ops! Não conseguimos encontrar essa publicação. Ela pode ter sido excluída.');
				}.bind(this));
		},
	},
});

module.exports = {
	initialize: function () {
		new WorkspaceRouter;
		// Backbone.history.start({ pushState:false, hashChange:true });
		Backbone.history.start({ pushState:true, hashChange: false });
	},
};
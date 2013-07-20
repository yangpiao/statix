{% extends 'layout.swig' %}
{% block content -%}
<div class="profile clearfix">
  <div class="profile-img">
    <img src="{{config.urlRoot}}/images/jsmith.png">
  </div>
  <div class="profile-txt">
    <h1 class="name">{{config.author}}</h1>
    <p class="short-bio">{{shortBio}}</p>
  </div>
</div>

<ul class="more clearfix">
  <li class="blogs">
    <h2 class="title">Recent Blogs</h2>
    <div class="content">
      <ul class="recent-posts">
      {% for post in blog.allPosts -%}
        {% if loop.index <= 5 -%}
        <li class="post"><a href="{{post.permalink}}">{{post.title}}</a></li>
        {%- endif %}
      {%- endfor %}
      </ul>
    </div>
  </li>
  <li class="projects">
    <h2 class="title">{{projTitle}}</h2>
    <div class="content">
      <p>{{projContent}}</p>
    </div>
  </li>
  <li class="others">
    <h2 class="title">{{otherTitle}}</h2>
    <div class="content">
      <p>{{otherContent}}</p>
    </div>
  </li>
</ul>

<div class="contact">
  Contact me: {{email}} <i>OR</i> @{{twitter}}.
</div>

{%- endblock %}

{% extends 'layout.swig' %}
{% block content %}
<div class="articles">
{% block articles %}{% endblock %}
</div>

<aside class="sidebar">
{% block sidebar %}
<section>
  <form action="http://google.com/search" method="get" class="searchform">
    <fieldset role="search">
      <input type="hidden" name="q" value="site:{{config.urlRoot}}">
      <input class="search" type="text" name="q" results="0" placeholder="Search">
    </fieldset>
  </form>
</section>
{% if allPosts %}
<section>
  <h1>Recent Posts</h1>
  <ul id="recent_posts">
  {% for post in allPosts %}
    {% if loop.index <= 10 %}
    <li class="post"><a href="{{post.permalink}}">{{post.title}}</a></li>
    {% endif %}
  {% endfor %}
</section>
{% endif %}
{% endblock %}
</aside>
{% endblock %}
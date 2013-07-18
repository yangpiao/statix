{% extends 'layout.swig' %}
{% block pagehead %}{% endblock %}

{% block content %}
<h1 class="blogtitle">Blogs</h1>
<div class="blogmain clearfix">
  <div class="articles">
  {% block articles %}{% endblock %}
  </div>

  <aside class="sidebar">
  {% block sidebar %}
  <section class="search">
    <form action="http://google.com/search" method="get" class="searchform">
      <input type="hidden" name="q" value="site:{{config.urlRoot}}">
      <input class="searchinput" type="text" name="q" results="0" placeholder="Search">
    </form>
  </section>
  <section>
    <h1>Pages</h1>
    <ul class="blog-pages">
      <li class="page"><a href="{{config.urlRoot}}/blog/archive.html">Archive</a></li>
    </ul>
  </section>
  {% if allPosts %}
  <section>
    <h1>Recent Posts</h1>
    <ul class="recent-posts">
    {% for post in allPosts %}
      {% if loop.index <= 10 %}
      <li class="post"><a href="{{post.permalink}}">{{post.title}}</a></li>
      {% endif %}
    {% endfor %}
    </ul>
  </section>
  {% endif %}
  {% endblock %}
  </aside>
</div>
{% endblock %}

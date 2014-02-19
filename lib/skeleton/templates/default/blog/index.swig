{% extends '../_layout/layout-blog.swig' %}

{% block articles -%}
{% for post in posts -%}
<article class="entry">
  <header>
    <h1 class="entry-title"><a href="{{post.permalink}}">{{post.title}}</a></h1>
    <p class="meta">
      <span class="author">By <span class="author-name">{{post.author}}</span></span> | <span class="time">{{post.time|date('F jS, Y')}}</span>
    </p>
  </header>
  <div class="entry-content">{{post.content|safe}}</div>
</article>
{%- endfor %}

<div class="pagination">
{% if pages.prevLink -%}
<a class="newer" href="{{pages.prevLink}}">Newer Posts &raquo;</a>
{% else %}
{%- endif %}
{% if pages.nextLink -%}
<a class="older" href="{{pages.nextLink}}">&laquo; Older Posts</a>
{% else %}
{%- endif %}
</div>
{%- endblock %}

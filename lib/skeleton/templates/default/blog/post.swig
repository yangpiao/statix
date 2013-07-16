{% extends 'blog/blogLayout.swig' %}

{% block articles %}
<article class="entry">
  <header>
    <h1 class="entry-title">{{title}}</h1>
    <p class="meta">
      <span class="author">By <span class="author-name">{{author}}</span></span> | <span class="time">{{time|date('F jS, Y')}}</span>
    </p>
  </header>
  <div class="entry-content">{{content|raw}}</div>
  <footer>
    <p class="meta">
      Tags: (function still in development)
    </p>
    <p class="meta">
      <a class="prev-post" href="{{prev.permalink}}" title="Previous Post: {{prev.title}}">&laquo; {{prev.title}}</a>
      <a class="next-post" href="{{next.permalink}}" title="Next Post: {{next.title}}">&raquo; {{next.title}}</a>
    </p>
  </footer>
</article>
{% endblock %}
{% extends '../_layout/layout-blog.swig' %}

{% block articles -%}
<article class="entry">
  <header>
    <h1 class="entry-title">{{title}}</h1>
    <p class="meta">
      <span class="author">By <span class="author-name">{{author}}</span></span> | <span class="time">{{time|date('F jS, Y')}}</span>
    </p>
  </header>
  <div class="entry-content">{{content|safe}}</div>
  <footer>
    <p class="meta tags">
      Tags:
      {% if tags.length -%}
      {% for tag in tags -%}
        <a href="{{config.urlRoot}}/blog/tags/{{tag}}.html"
          title="View posts with {{tag}}">{{tag}}</a>{% if not loop.last %},{% endif %}
      {%- endfor %}
      {% else %}
      <a href="{{config.urlRoot}}/blog/tags/no-tag.html"
        title="View posts with no tag">no tag</a>.
      {%- endif %}
    </p>
    <p class="meta pagination">
      {% if prev -%}
      <a class="older" href="{{prev.permalink}}" title="Previous Post: {{prev.title}}">&laquo; {{prev.title}}</a>
      {%- endif %}
      {% if next -%}
      <a class="newer" href="{{next.permalink}}" title="Next Post: {{next.title}}">&raquo; {{next.title}}</a>
      {%- endif %}
    </p>
  </footer>
</article>

{% if config.disqus -%}
<section class="comments">
  <h1>Comments</h1>
  <div id="disqus_thread">
    <noscript>Please enable JavaScript to view the 
      <a href="http://disqus.com/?ref_noscript">comments powered by Disqus.</a>
    </noscript>
  </div>
</section>
<!-- Disqus script -->
<script type="text/javascript">
var disqus_shortname = '{{config.disqus}}';
// var disqus_developer = 1;
var disqus_identifier = '{{permalink}}';
var disqus_url = '{{permalink}}';
var disqus_script = 'embed.js';
(function () {
  var dsq = document.createElement('script');
  dsq.type = 'text/javascript';
  dsq.async = true;
  dsq.src = 'http://' + disqus_shortname + '.disqus.com/' + disqus_script;
  (document.getElementsByTagName('head')[0] ||
    document.getElementsByTagName('body')[0]).appendChild(dsq);
}());
</script>
{%- endif %}
{%- endblock %}

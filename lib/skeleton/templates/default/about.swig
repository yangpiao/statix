{% extends 'layout.swig' %}
{% block content -%}
<div class="about">
  <h1>{{title}}</h1>
  <p>{{content|raw}}</p>
</div>
{%- endblock %}

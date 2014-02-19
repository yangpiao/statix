{% extends '_layout/layout.swig' %}
{% block bodytag -%}<body class="about">{%- endblock %}
{% block content -%}
<div class="about">
  <h1>{{title}}</h1>
  <p>{{content|safe}}</p>
</div>
{%- endblock %}

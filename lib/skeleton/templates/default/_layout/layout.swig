{% include 'head.swig' %}
{% block bodytag -%}
<body class="home">
{%- endblock %}
{% include 'header.swig' %}

{% block pagehead -%}
<header class="pagehead">
  <div class="container">
    <h1 class="name">{{config.sitename}}</h1>
    <p class="description">{{config.sitedesc}}</p>
  </div>
</header>
{%- endblock %}
<div class="pagebody">
  <div class="container">
    {% block content %}{% endblock %}
  </div>
</div>

{% include 'footer.swig' %}
{% include 'foot.swig' %}

  <div class="pagetop">
    <div class="container clearfix">
      <h1 class="sitename"><a href="{{config.urlRoot}}">{{config.sitename}}</a></h1>
      <nav class="navbar">
        <ul>
        {% for np in config.navbar -%}
          <li class="{{np.className}}">
            <a href="{{config.urlRoot}}/{{np.url}}">{{np.name}}</a>
          </li>
        {%- endfor %}
        </ul>
      </nav>
    </div>
  </div>

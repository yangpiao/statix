<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{config.sitename}}{% if title %} - {{title}}{% endif %}</title>
  <meta content='IE=edge,chrome=1' http-equiv='X-UA-Compatible'>
  <meta name="author" content="{{config.author}}">
  {% if config.description %}
  <meta name="description" content="{{config.description}}">
  {% endif %}
  {% if config.keywords %}
  <meta name="keywords" content="{{config.keywords}}">
  {% endif %}
  <meta name="HandheldFriendly" content="True">
  <meta name="MobileOptimized" content="320">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href='{{config.urlRoot}}/favicon.ico' rel='shortcut icon' type='image/x-icon'>
  {% block head %}
  <link href='http://fonts.googleapis.com/css?family=Open+Sans:300,300italic,400,400italic'
    rel='stylesheet' type='text/css'>
  <link rel="stylesheet" href="{{config.urlRoot}}/css/main.css">
  {% endblock %}
</head>


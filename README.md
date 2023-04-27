 # Apex-Dynamic-Tooltip

![Screenshot](https://github.com/RonnyWeiss/Apex-Dynamic-Tooltip/blob/master/screenshot.gif?raw=true)

This plug-in is used to dynamically show a tooltip on any page element. With mouse-hover the content of the tooltip is loaded live from the database. Filter attributes in the desired element can then be used to filter the select. E.g.:

&lt;h2 id=&quot;myID&quot; pk=&quot;1&quot;, sk=&quot;2&quot;&gt;test&lt;/h2&gt;

So when you make a mouse-hover then the select uses the two attributes pk and sk to filter in sql statement. There is also a third one &quot;tk&quot;. To submit these values you need three setable items on the page and these where set on hover. Then they where submitted and can be used as filter in sql statement.

For working Demo just click on:

https://APEX.oracle.com/pls/APEX/f?p=103428

If you like my stuff, donate me a coffee

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.me/RonnyW1)

**Important clarification: My work in the development team of Oracle APEX is in no way related to my open source projects or the plug-ins on apex.world! All plug-ins are built in my spare time and are not supported by Oracle!**
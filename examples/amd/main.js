requirejs.config({
  baseUrl: "../../dist/amd"
});

requirejs(["lib/backburner"], function(Backburner) {

  var backburner = new Backburner.default(['render']);

  person = {name: "Erik"};

  function updateName() {
    document.getElementById("name").innerHTML = person.name;
  }

  function setName(name) {
    person.name = name;
    backburner.deferOnce('render', updateName);
  }

  backburner.run(function() {
    setName("Kris");
    setName("Tom");
    setName("Yehuda");
  });

});

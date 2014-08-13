/*
 * Using wildcard because Backburner does not currently have a
 * channel system in place.
 */
module.exports = function(revision,tag,date){
  return {
    'backburner.js':
      { contentType: 'text/javascript',
        destinations: {
          wildcard: [
            'backburner-latest.js',
            'backburner-' + revision + '.js'
          ]
        }
      },
    'backburner.min.js':
      { contentType: 'text/javascript',
        destinations: {
          wildcard: [
            'backburner-latest.min.js',
            'backburner-' + revision + '.min.js'
          ]
        }
      }
  }
}


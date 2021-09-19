import RMask from '../../lib/rmask';

new RMask('.date').mask('00/00/0000');
new RMask('.time').mask('00:00:00');
new RMask('.date').mask('00/00/0000');
new RMask('.time').mask('00:00:00');
new RMask('.date_time').mask('00/00/0000 00:00:00');
new RMask('.cep').mask('00000-000');
new RMask('.phone').mask('0000-0000');
new RMask('.phone_with_ddd').mask('(00) 0000-0000');
new RMask('.phone_us').mask('(000) 000-0000');
new RMask('.mixed').mask('AAA 000-S0S');
new RMask('.ip_address').mask('099.099.099.099');
new RMask('.percent').mask('##0,00%', { reverse: true });
new RMask('.clear-if-not-match').mask('00/00/0000', { clearIfNotMatch: true });
new RMask('.placeholder').mask("00/00/0000", { placeholder: "__/__/____" });
new RMask('.fallback').mask("00r00r0000", {
   translation: {
      'r': {
         pattern: /[\/]/,
         fallback: '/'
      },
      placeholder: "__/__/____"
   }
});

new RMask('.selectonfocus').mask("00/00/0000", { selectOnFocus: true });

new RMask('.cep_with_callback').mask('00000-000', {
   onComplete: function (cep) {
      console.log('Mask is done!:', cep);
   },
   onKeyPress: function (cep, event, currentField, options) {
      console.log('An key was pressed!:', cep, ' event: ', event, 'currentField: ', currentField.getAttribute('class'), ' options: ', options);
   },
   onInvalid: function (val, e, field, invalid, options) {
      var error = invalid[0];
      console.log("Digit: ", error.v, " is invalid for the position: ", error.p, ". We expect something like: ", error.e);
   }
});

new RMask('.crazy_cep').mask('00000-000', {
   onKeyPress: function (cep, e, field, options) {
      var masks = ['00000-000', '0-00-00-00'];
      var mask = (cep.length > 7) ? masks[1] : masks[0];
      new RMask('.crazy_cep').mask(mask, options);
   }
});

new RMask('.cnpj').mask('00.000.000/0000-00', { reverse: true });
new RMask('.cpf').mask('000.000.000-00', { reverse: true });
new RMask('.money').mask('#.##0,00', { reverse: true });

var SPMaskBehavior = function (val) {
   return val.replace(/\D/g, '').length === 11 ? '(00) 00000-0000' : '(00) 0000-00009';
},
   spOptions = {
      onKeyPress: function (val, e, field, selector, options) {
         new RMask(selector).mask(SPMaskBehavior.apply({}, arguments), options);
      }
   };

new RMask('.sp_celphones').mask(SPMaskBehavior, spOptions);

var button = document.querySelector(".bt-mask-it");
button.addEventListener('click', function () {
   new RMask(".mask-on-div").mask("000.000.000-00");
   var test = new RMask(".mask-on-div");
});

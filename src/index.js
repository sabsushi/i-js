function analisarNumero(number) {
  if (number === 15) {
       console.log('É igual a 15');
    return 
  } else if (number % 5 === 0) {
    console.log('função interrompida, pois o número é múltiplo de 5');
    return 
  } else if (number >= 10 && number <= 20) {
    console.log('Está entre 10 e 20');
    return 
  } else {
    console.log('Não está entre 10 e 20');
    return 
  }
}

const myarrai = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30];

const numero = 12;
const resultado = analisarNumero(numero);
console.log(resultado);
console.log(myarrai)



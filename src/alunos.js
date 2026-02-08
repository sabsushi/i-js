function funcA() {
  return [
    { id: 1, name: "Bob", grades: [8, 7], role: "default" },   
    { id: 2, name: "Billy", grades: [], role: "admin" },       
    { id: 3, name: "Bobert", grades: [0, 6], role: "editor" }, 
    { id: 4, name: "", grades: [10, 9], role: "default" },     
    { id: 5, grades: [10, 9], role: "default" },              
  ];
}

function getAverage(values) {
  if (!values || values.length === 0) return 0;

  let result = 0;
  for (const value of values) {
    result += value;  
  }
  return result / values.length;  
}


function getLabel(role) {
  switch (role) {
    case "admin":
      return "[Acesso total]";
    case "editor":
      return "[Pode editar]";
    default:
      return "[Acesso limitado]";
  }
}

function funcB(a) {
  const result = [];  
  let index = 1;      

  for (const aluno of a) {
    let name;

    if (aluno.name === "") {
      name = "Sem nome";
    }
    else if (aluno.name == null) {
      name = "Anónimo";
    }
    else {
      name = aluno.name;
    }

    const grades = aluno.grades ?? [];
    const role = aluno.role;

    const average = getAverage(grades);

    const status = average >= 10 ? "Aprovado" : "Reprovado";

    const label = getLabel(role);

    result.push(
      `${index}) ${name} - média: ${average} - status: ${status} ${label}`
    );

    index++;  
  }

  return result; 
}

function funcC(b) {
  for (const linha of b) {
    console.log(linha); 
  }
}

const alunos = funcA();
const linhas = funcB(alunos);
funcC(linhas);

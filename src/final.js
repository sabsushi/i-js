// ==========================================
// DESAFIO FINAL 01
// Tema: Mini-sistema de Loja + Caixa + Estoque
// ==========================================

// Objetivo
// Você vai construir um sistema completo (em memória, sem banco de dados) que:
// - mantém um catálogo de produtos e um estoque
// - cria carrinhos de compra, valida quantidades e calcula totais
// - aplica regras de preço (promoções/cupões) com prioridades e restrições
// - calcula impostos (IVA) por categoria
// - finaliza pedidos e imprime um cupom fiscal detalhado
// - gera relatórios simples de vendas

// Regras gerais
// - Não use bibliotecas externas.
// - Use apenas JavaScript (Node.js).
// - Não apague as assinaturas (nomes/params) dos métodos marcados como TODO.
// - Use estruturas de dados adequadas (Map/Array/Object).
// - Todas as validações devem lançar Error com mensagens claras.

// Como usar
// - Complete os TODOs.
// - Ao final, descomente a chamada de runDemo() no fim do arquivo.
// - O demo executa cenários que devem passar.

// ==========================================
// PARTE 0 - Dados e utilitários
// ==========================================

const CATEGORIAS = [
	"eletrodoméstico",
	"decoração",
	"materiais de construção",
	"vestuário",
	"alimentos"
];

const IVA_POR_CATEGORIA = {
	"eletrodoméstico": 0.23,
	"decoração": 0.23,
	"materiais de construção": 0.23,
	"vestuário": 0.23,
	"alimentos": 0.06
};


function round2(value) {
	return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatBRL(value) {
	return `R$ ${round2(value).toFixed(2)}`.replace(".", ",");
}


function assertPositiveNumber(value, label) {
	if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value) || value <= 0) {
		throw new Error(`${label} deve ser um número positivo.`);
	}
}

function assertNonNegativeInt(value, label) {
	if (!Number.isInteger(value) || value < 0) {
		throw new Error(`${label} deve ser um inteiro >= 0.`);
	}
}

function assertCategoriaValida(categoria) {
	if (!CATEGORIAS.includes(categoria)) {
		throw new Error(`Categoria inválida: ${categoria}. Aceitas: ${CATEGORIAS.join(", ")}`);
	}
}

// ==========================================
// PARTE 1 - Modelos principais (classes)
// ==========================================

// 1) Crie a classe Produto
// Requisitos mínimos:
// - sku (string) único
// - nome (string)
// - preco (number > 0)
// - fabricante (string)
// - categoria (deve estar em CATEGORIAS)
// - numeroMaximoParcelas (int 1..24)
// Métodos:
// - getValorDeParcela(numeroDeParcelas) => number
//   - deve validar: numeroDeParcelas int >=1 e <= numeroMaximoParcelas
//   - retorna preco / numeroDeParcelas (2 casas)

class Produto {
	constructor({ sku, nome, preco, fabricante, categoria, numeroMaximoParcelas }) {
        
		if (!sku || !nome) throw new Error("SKU e Nome são obrigatórios.");
		assertPositiveNumber(preco, "preco");
		assertNonNegativeInt(numeroMaximoParcelas, "numeroMaximoParcelas");
		assertCategoriaValida(categoria);
		
		this.sku = sku;
		this.nome = nome;
		this.preco = preco;
		this.fabricante = fabricante;
		this.categoria = categoria;
		this.numeroMaximoParcelas = numeroMaximoParcelas;
		
	}
	


	getValorDeParcela(numeroDeParcelas) {
		assertNonNegativeInt(numeroDeParcelas, "numeroDeParcelas");
		for (let i = 1; i <= this.numeroMaximoParcelas; i++) {
			if (numeroDeParcelas === i) {
				return round2(this.preco / numeroDeParcelas);
			}
		}
		throw new Error(`Número de parcelas inválido. Deve ser entre 1 e ${this.numeroMaximoParcelas}.`);
	}
}

// 2) Crie a classe Cliente
// Requisitos:
// - id (string)
// - nome (string)
// - tipo: "REGULAR" | "VIP"
// - saldoPontos (int >= 0)
// Métodos:
// - adicionarPontos(pontos)
// - resgatarPontos(pontos) => diminui saldo, valida


class Cliente {
    constructor({ id, nome, tipo = "REGULAR", saldoPontos = 0 }) {
        this.id = String(id);
        this.nome = String(nome);
        this.tipo = tipo.toUpperCase() === "VIP" ? "VIP" : "REGULAR";
        
        assertNonNegativeInt(saldoPontos, "Saldo de pontos");
        this.saldoPontos = saldoPontos;
    }

  
    adicionarPontos(pontos) {
        assertNonNegativeInt(pontos, "Pontos a adicionar");
        this.saldoPontos += pontos;
    }


    resgatarPontos(pontos) {
        assertNonNegativeInt(pontos, "Pontos a resgatar");
        
        if (pontos > this.saldoPontos) {
            throw new Error(`Saldo insuficiente. O cliente possui apenas ${this.saldoPontos} pontos.`);
        }
        
        this.saldoPontos -= pontos;
    }
}


// 3) Crie a classe ItemCarrinho
// Requisitos:
// - sku (string)
// - quantidade (int >= 1)
// - precoUnitario (number > 0) *congelado no momento de adicionar*
// Observação: o carrinho usa precoUnitario do momento (para simular mudança de preço no catálogo).


class ItemCarrinho {
	constructor({ sku, quantidade, precoUnitario }) {
		if (!sku) throw new Error("SKU do item é obrigatório.");
        
        assertNonNegativeInt(quantidade, "quantidade");
        if (quantidade < 1) {
            throw new Error("A quantidade de um item no carrinho deve ser pelo menos 1.");
        }
        
        assertPositiveNumber(precoUnitario, "precoUnitario");

        this.sku = String(sku);
        this.quantidade = quantidade;
        this.precoUnitario = precoUnitario;
	}

	
	getTotal() {
		return round2(this.quantidade * this.precoUnitario);
	}
}

	// 4) Crie a classe Estoque
	// Use Map para guardar { sku -> quantidade }
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
	// Métodos:
	// - definirQuantidade(sku, quantidade)
	// - adicionar(sku, quantidade)
	// - remover(sku, quantidade)
	// - getQuantidade(sku)
	// - garantirDisponibilidade(sku, quantidade)

class Estoque {
	constructor() {
		this.itens = new Map();
	}

	definirQuantidade(sku, quantidade) {
		assertNonNegativeInt(quantidade, "Quantidade");
        this.itens.set(sku, quantidade);
	}

	
	adicionar(sku, quantidade) {
		assertNonNegativeInt(quantidade, "Quantidade a adicionar");
        const saldoAtual = this.itens.get(sku) || 0;
        this.itens.set(sku, saldoAtual + quantidade);
	}

	remover(sku, quantidade) {
		assertNonNegativeInt(quantidade, "Quantidade a remover");
        this.garantirDisponibilidade(sku, quantidade);
        const saldoAtual = this.itens.get(sku);
        const novaQuantidade = saldoAtual - quantidade;
        this.itens.set(sku, novaQuantidade);
	}

	getQuantidade(sku) {
		return this.itens.get(sku) || 0;	
	}
	
	garantirDisponibilidade(sku, quantidade) {
		const disponivel = this.getQuantidade(sku);
        if (disponivel < quantidade) {
            throw new Error(`Estoque insuficiente para SKU ${sku}. Disponível: ${disponivel}, solicitado: ${quantidade}.`);
        }
	}
	
}

// 5) Crie a classe Catalogo
// Use Map para guardar { sku -> Produto }
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
// Métodos:
// - adicionarProduto(produto)
// - getProduto(sku)
// - listarPorCategoria(categoria)
// - atualizarPreco(sku, novoPreco)

class Catalogo  {
	constructor() {
		this.itens = new Map();
	}

	adicionarProduto(produto) {
		if (!(produto instanceof Produto)) {
			throw new Error("Produto deve ser uma instância da classe Produto.");
		}
		if (this.itens.has(produto.sku)) {
			throw new Error(`Produto com SKU ${produto.sku} já existe no catálogo.`);
		}
		this.itens.set(produto.sku, produto);
	}

	getProduto(sku) {
		const produto = this.itens.get(sku);
		if (!produto) {
			throw new Error(`Produto com SKU ${sku} não encontrado no catálogo.`);
		}
		return produto;
	}

	listarPorCategoria(categoria) {
		assertCategoriaValida(categoria);
		const resultado = [];
		for (const produto of this.itens.values()) {
			if (produto.categoria === categoria) {
				resultado.push(produto);
			}
		}
		return resultado;
	}

	atualizarPreco(sku, novoPreco) {
		const produto = this.getProduto(sku);
        assertPositiveNumber(novoPreco, "Novo preço"); 
        produto.preco = novoPreco;
	}
}

// 6) Crie a classe CarrinhoDeCompras
// Responsabilidades:
// - adicionar itens (validando estoque)
// - remover itens
// - alterar quantidade
// - calcular subtotal
// - consolidar itens por sku (sem duplicatas)
// Sugestão: use Map sku -> ItemCarrinho
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map

class CarrinhoDeCompras {
	constructor({ catalogo, estoque }) {
		this.catalogo = catalogo;
		this.estoque = estoque;
		this.itens = new Map();
	}


	adicionarItem(sku, quantidade) {
		const produto = this.catalogo.getProduto(sku);
		
		const itemExistente = this.itens.get(sku);
		const novaQuantidadeTotal = itemExistente ? itemExistente.quantidade + quantidade : quantidade;
		
		this.estoque.garantirDisponibilidade(sku, novaQuantidadeTotal);

		if (itemExistente){
			itemExistente.quantidade = novaQuantidadeTotal;
		} else {
			const novoItem = new ItemCarrinho({
				sku, 
				quantidade, 
				precoUnitario: produto.preco
			});
			this.itens.set(sku, novoItem);
		}
	}

	removerItem(sku) {
	 	if(!this.itens.has(sku)){
			throw new Error(`Item com SKU ${sku} não encontrado no carrinho.`);
	 	}
		this.itens.delete(sku);
	}

	alterarQuantidade(sku, novaQuantidade) {
		if(!this.itens.has(sku)){
			throw new Error(`Item com SKU ${sku} não encontrado no carrinho.`);
	 	}
		this.estoque.garantirDisponibilidade(sku, novaQuantidade);
		const item = this.itens.get(sku);
		item.quantidade = novaQuantidade;
	}

	listarItens() {
		return Array.from(this.itens.values());
	}

	getSubtotal() {
		let subtotal = 0;
		for(const item of this.itens.values()){
			subtotal += item.getTotal();
		}
		return round2(subtotal);
	}
}

// ==========================================
// PARTE 2 - Regras de preço (promoções)
// ==========================================

// Você implementará um motor de preços com as regras abaixo.
// Você deve conseguir produzir um “breakdown” (quebra) do total:
// - subtotal
// - descontos (lista com nome + valor)
// - base de imposto
// - imposto total
// - frete
// - total final

// Estrutura sugerida do breakdown (objeto):
// {
//   subtotal,
//   descontos: [{ codigo, descricao, valor }],
//   totalDescontos,
//   impostoPorCategoria: { [categoria]: valor },
//   totalImpostos,
//   frete,
//   total
// }

// 7) Regras obrigatórias (todas devem existir e ser testáveis):
// R1 - Desconto VIP:
// - Se cliente.tipo === "VIP", aplica 5% no subtotal (apenas uma vez).
// - Não pode ser aplicado se existir cupom "SEM-VIP".
//
// R2 - Cupom:
// - Cupom "ETIC10" => 10% no subtotal
// - Cupom "FRETEGRATIS" => frete zerado
// - Cupom "SEM-VIP" => bloqueia R1
// - Cupom inválido deve lançar Error
//
// R3 - Leve 3 pague 2 (vestuário):
// - Para produtos da categoria "vestuário": a cada 3 unidades (somando SKUs diferentes),
//   a unidade mais barata dentre as 3 sai grátis.
// - Ex: 3 camisetas (10), 1 calça (50), 1 meia (5) => total unidades=5 => aplica 1 grátis
//   (a mais barata dentro do grupo de 3) e sobram 2 sem promo.
//
// R4 - Desconto por valor:
// - Se subtotal >= 500, aplica desconto fixo de 30.
//
// Observação de dificuldade:
// - Você precisa decidir ordem de aplicação e documentar.
// - Você precisa impedir descontos maiores que o subtotal.
// - Deve ser determinístico.

// 8) Crie uma classe MotorDePrecos
// Método principal:
// - calcular({ cliente, itens, cupomCodigo }) => breakdown
// Onde itens é o resultado de carrinho.listarItens()


class MotorDePrecos {
	constructor({ catalogo }) {
        this.catalogo = catalogo;
        this.FRETE_PADRAO = 20.00;
	}


	calcular({ cliente, itens, cupomCodigo }) {
		if (itens.length === 0) throw new Error("Carrinho vazio.");

        let subtotal = 0;
        const listaDescontos = [];
        const itensExpandidos = []; 

        // 1. Cálculo do Subtotal e Expansão de itens
        itens.forEach(item => {
            subtotal += item.getTotal();
            // uma lista "unitária" para facilitar o R3
            for (let i = 0; i < item.quantidade; i++) {
                const p = this.catalogo.getProduto(item.sku);
                itensExpandidos.push({ sku: item.sku, preco: item.precoUnitario, categoria: p.categoria });
            }
        });

        let totalDescontos = 0;
        let frete = this.FRETE_PADRAO;

        // validação inicial do Cupom 
        const cuponsValidos = ["ETIC10", "FRETEGRATIS", "SEM-VIP"];
        if (cupomCodigo && !cuponsValidos.includes(cupomCodigo)) {
            throw new Error(`Cupom inválido: ${cupomCodigo}`);
        }

        //leve 3 Pague 2 (vestuario)
        const vestuario = itensExpandidos
            .filter(i => i.categoria === "vestuário")
            .sort((a, b) => a.preco - b.preco); // Do mais barato ao mais caro

        const unidadesGratis = Math.floor(vestuario.length / 3);
        if (unidadesGratis > 0) {
            let valorR3 = 0;
            for (let i = 0; i < unidadesGratis; i++) {
                valorR3 += vestuario[i].preco;
            }
            listaDescontos.push({ codigo: "L3P2", descricao: "Leve 3 Pague 2 (Vestuário)", valor: round2(valorR3) });
            totalDescontos += valorR3;
        }

        //VIP discount
        const permiteVIP = cupomCodigo !== "SEM-VIP";
        if (cliente.tipo === "VIP" && permiteVIP) {
            const valorVIP = (subtotal - totalDescontos) * 0.05;
            listaDescontos.push({ codigo: "VIP5", descricao: "Desconto Cliente VIP", valor: round2(valorVIP) });
            totalDescontos += valorVIP;
        }

        // appliying coupon effects
        if (cupomCodigo === "ETIC10") {
            const valorEtic = (subtotal - totalDescontos) * 0.10;
            listaDescontos.push({ codigo: "ETIC10", descricao: "Cupom 10% OFF", valor: round2(valorEtic) });
            totalDescontos += valorEtic;
        } else if (cupomCodigo === "FRETEGRATIS") {
            frete = 0;
            listaDescontos.push({ codigo: "FRETEGRATIS", descricao: "Frete Grátis", valor: 0 });
        }

        // Fixed amount discount
        const subtotalAposPercentuais = subtotal - totalDescontos;
        if (subtotalAposPercentuais >= 500) {
            const valorFixo = 30;
            listaDescontos.push({ codigo: "FIXO30", descricao: "Desconto Compra > 500", valor: valorFixo });
            totalDescontos += valorFixo;
        }

        // taxess and final details
        totalDescontos = Math.min(totalDescontos, subtotal);
        const baseImposto = subtotal - totalDescontos;

        let totalImpostos = 0;
        const impostoPorCategoria = {};

        itens.forEach(item => {
            const p = this.catalogo.getProduto(item.sku);
            const taxa = IVA_POR_CATEGORIA[p.categoria] || 0;
            const proporcaoNoTotal = item.getTotal() / subtotal;
            const impostoItem = (baseImposto * proporcaoNoTotal) * taxa;
            
            impostoPorCategoria[p.categoria] = round2((impostoPorCategoria[p.categoria] || 0) + impostoItem);
            totalImpostos += impostoItem;
        });

        return {
            subtotal: round2(subtotal),
            descontos: listaDescontos,
            totalDescontos: round2(totalDescontos),
            baseImposto: round2(baseImposto),
            impostoPorCategoria,
            totalImpostos: round2(totalImpostos),
            frete: round2(frete),
            total: round2(baseImposto + totalImpostos + frete)
        };
    }
}

// ==========================================
// PARTE 3 - Checkout / Pedido / Cupom
// ==========================================

// 9) Crie a classe Pedido
// Requisitos:
// - id (string)
// - clienteId
// - itens (array)
// - breakdown (objeto)
// - status: "ABERTO" | "PAGO" | "CANCELADO"
// - createdAt (Date)
// Métodos:
// - pagar()
// - cancelar()

class Pedido {
	constructor({ id, clienteId, itens, breakdown }) {
		this.id = id;
		this.clienteId = clienteId;
		this.itens = itens;
		this.breakdown = breakdown;
		this.status = "ABERTO";
		this.createdAt = new Date();
	}

	pagar() {
		if (this.status !== "ABRRTO") throw new Error("Pedido não pode ser pago.");
		this.status = "PAGO";
	}

	cancelar() {
		if (this.status !== "ABERTO") throw new Error("Pedido não pode ser cancelado.");
		this.status = "CANCELADO";
	}
}

// 10) Crie a classe CaixaRegistradora
// Responsabilidades:
// - receber (catalogo, estoque, motorDePrecos)
// - fecharCompra({ cliente, carrinho, cupomCodigo, numeroDeParcelas }) => Pedido
// Regras:
// - Ao fechar compra, deve remover do estoque as quantidades compradas
// - Se numeroDeParcelas for informado, deve validar com base no Produto (máximo permitido)
// - Deve somar parcelas por item e imprimir um resumo no cupom (opcional, mas recomendado)

class CaixaRegistradora {
	constructor({ catalogo, estoque, motorDePrecos }) {
		this.catalogo = catalogo;
		this.estoque = estoque;
		this.motorDePrecos = motorDePrecos;
		this.proximoIdPedido = 1;
	}

	fecharCompra({ cliente, carrinho, cupomCodigo = null, numeroDeParcelas = 1 }) {
		const itens = carrinho.listarItens();
		if (itens.length === 0) throw new Error("Carrinho está vazio.");

		//validation of parcels per each product
		itens.forEach(item => {
			const produto = this.catalogo.getProduto(item.sku);
			if (numeroDeParcelas > produto.numeroMaximoParcelas) {
				throw new Error(`Produto ${produto.nome} permite no máximo ${produto.numeroMaximoParcelas} parcelas.`);
			}
		});

		// breakdown calculation
		const breakdown = this.motorDePrecos.calcular({ cliente, itens, cupomCodigo });

		itens.forEach(item => {
			this.estoque.remover(item.sku, item.quantidade);
		});

		const pedido = new Pedido({
			id: `PED-${this.proximoIdPedido++}`,
			clienteId: cliente.id,
			itens: [...itens],
			breakdown
		});

		return pedido;
	}
}

// 11) Crie a classe CupomFiscal
// Deve gerar texto em linhas (array de strings) contendo:
// - cabeçalho
// - itens: sku, quantidade, preço unitário, total do item
// - subtotal, descontos (linha por desconto), impostos (por categoria), frete, total
// - status do pedido

class CupomFiscal {
	constructor({ pedido, catalogo }) {
		this.pedido = pedido;
		this.catalogo = catalogo;
	}

	gerarLinhas() {
		const b = this.pedido.breakdown;
		const linhas = [];
		linhas.push("==========================================");
		linhas.push("              CUPOM FISCAL                ");
		linhas.push(`Pedido ID: ${this.pedido.id}`);
		linhas.push(`Data: ${this.pedido.createdAt.toLocaleString()}`);
		linhas.push("------------------------------------------");
		linhas.push("SKU      QTD    UNID.     TOTAL");

		this.pedido.itens.forEach(item => {
			const p = this.catalogo.getProduto(item.sku);
			linhas.push(`${item.sku.padEnd(8)} ${String(item.quantidade).padEnd(6)} ${formatBRL(item.precoUnitario).padEnd(10)} ${formatBRL(item.getTotal())}`);
		});

		linhas.push("------------------------------------------");
		linhas.push(`SUBTOTAL:              ${formatBRL(b.subtotal)}`);
		
		b.descontos.forEach(d => {
			linhas.push(`${d.descricao}: -${formatBRL(d.valor)}`);
		});

		linhas.push(`FRETE:                 ${formatBRL(b.frete)}`);
		linhas.push("IMPOSTOS:");
		for (const cat in b.impostoPorCategoria) {
			linhas.push(`  - ${cat}: ${formatBRL(b.impostoPorCategoria[cat])}`);
		}
		
		linhas.push("------------------------------------------");
		linhas.push(`TOTAL FINAL:           ${formatBRL(b.total)}`);
		linhas.push(`STATUS: ${this.pedido.status}`);
		linhas.push("==========================================");

		return linhas;
	}
}

class Impressora {
	imprimirLinhas(linhas) {
		for (const linha of linhas) {
			console.log(linha);
		}
	}
}

// ==========================================
// PARTE 4 - Relatórios (estruturas de dados + loops)
// ==========================================

// 12) Crie a classe RelatorioVendas
// - Deve armazenar pedidos pagos
// - Deve gerar:
//   - totalArrecadado()
//   - totalImpostos()
//   - totalDescontos()
//   - rankingProdutosPorQuantidade(topN)
//   - arrecadadoPorCategoria()
// Sugestão: use Map para acumular por sku/categoria.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map

class RelatorioVendas {
	constructor() {
		this.pedidosPagos = [];
	}

	registrarPedido(pedido) {
		if (pedido.status === "PAGO") {
			this.pedidosPagos.push(pedido);
		}
	}

	totalArrecadado() {
		return round2(this.pedidosPagos.reduce((acc, p) => acc + p.breakdown.total, 0));
	}

	totalImpostos() {
		return round2(this.pedidosPagos.reduce((acc, p) => acc + p.breakdown.totalImpostos, 0));
	}

	totalDescontos() {
		return round2(this.pedidosPagos.reduce((acc, p) => acc + p.breakdown.totalDescontos, 0));
	}

	rankingProdutosPorQuantidade(topN = 5) {
		const contagem = new Map();
		this.pedidosPagos.forEach(p => {
			p.itens.forEach(item => {
				const atual = contagem.get(item.sku) || 0;
				contagem.set(item.sku, atual + item.quantidade);
			});
		});

		return Array.from(contagem.entries())
			.sort((a, b) => b[1] - a[1])
			.slice(0, topN);
	}
//got help from copilot
	arrecadadoPorCategoria() {
		const categorias = new Map();
		this.pedidosPagos.forEach(p => {
			p.itens.forEach(item => {
				const atual = categorias.get("geral") || 0;
			});
		});
		return "Relatório detalhado por categoria requer acesso ao catálogo.";
	}
}

// ==========================================
// DADOS DE TESTE (para o demo)
// ==========================================

function seedCatalogoEEstoque() {
	const catalogo = new Catalogo();
	const estoque = new Estoque();

	const produtos = [
		// food
		{ sku: "ARROZ", nome: "Arroz 1kg", preco: 6.0, fabricante: "Marca A", categoria: "alimentos", numeroMaximoParcelas: 1 },
		{ sku: "FEIJAO", nome: "Feijão 1kg", preco: 7.5, fabricante: "Marca B", categoria: "alimentos", numeroMaximoParcelas: 1 },
		{ sku: "OLEO", nome: "Óleo 900ml", preco: 8.0, fabricante: "Marca C", categoria: "alimentos", numeroMaximoParcelas: 1 },
		//clothes
		{ sku: "CAMISETA", nome: "Camiseta", preco: 30.0, fabricante: "Hering", categoria: "vestuário", numeroMaximoParcelas: 6 },
		{ sku: "CALCA", nome: "Calça Jeans", preco: 120.0, fabricante: "Levis", categoria: "vestuário", numeroMaximoParcelas: 6 },
		{ sku: "MEIA", nome: "Meia", preco: 10.0, fabricante: "Puket", categoria: "vestuário", numeroMaximoParcelas: 6 },
		//electronics
		{ sku: "MICRO", nome: "Micro-ondas", preco: 499.9, fabricante: "LG", categoria: "eletrodoméstico", numeroMaximoParcelas: 12 },
		{ sku: "LIQUID", nome: "Liquidificador", preco: 199.9, fabricante: "Philco", categoria: "eletrodoméstico", numeroMaximoParcelas: 10 },
		//decoration
		{ sku: "VASO", nome: "Vaso Decorativo", preco: 89.9, fabricante: "Tok&Stok", categoria: "decoração", numeroMaximoParcelas: 5 },
		//construction materials
		{ sku: "CIMENTO", nome: "Cimento 25kg", preco: 35.0, fabricante: "Holcim", categoria: "materiais de construção", numeroMaximoParcelas: 3 }
	];

	for (const p of produtos) {
		const produto = new Produto(p);
		catalogo.adicionarProduto(produto);
	}

	// initial invertory
	estoque.definirQuantidade("ARROZ", 50);
	estoque.definirQuantidade("FEIJAO", 50);
	estoque.definirQuantidade("OLEO", 50);
	estoque.definirQuantidade("CAMISETA", 20);
	estoque.definirQuantidade("CALCA", 10);
	estoque.definirQuantidade("MEIA", 30);
	estoque.definirQuantidade("MICRO", 5);
	estoque.definirQuantidade("LIQUID", 8);
	estoque.definirQuantidade("VASO", 10);
	estoque.definirQuantidade("CIMENTO", 100);

	return { catalogo, estoque };
}

// ==========================================
// DEMO (cenários obrigatórios)
// ==========================================

function runDemo() {
	const { catalogo, estoque } = seedCatalogoEEstoque();
	const motor = new MotorDePrecos({ catalogo });
	const caixa = new CaixaRegistradora({ catalogo, estoque, motorDePrecos: motor });
	const relatorio = new RelatorioVendas();
	const impressora = new Impressora();

	const clienteVip = new Cliente({ id: "C1", nome: "Ana", tipo: "VIP", saldoPontos: 0 });
	const clienteRegular = new Cliente({ id: "C2", nome: "Bruno", tipo: "REGULAR", saldoPontos: 0 });

	// A
	console.log("\n---CENÁRIO A (VIP + L3P2)---");
	{
		const carrinho = new CarrinhoDeCompras({ catalogo, estoque });
		carrinho.adicionarItem("CAMISETA", 2);
		carrinho.adicionarItem("MEIA", 1);
		carrinho.adicionarItem("CALCA", 1);

		const pedido = caixa.fecharCompra({
			cliente: clienteVip,
			carrinho,
			cupomCodigo: null,
			numeroDeParcelas: 3
		});

		pedido.pagar();
		relatorio.registrarPedido(pedido);

		const cupom = new CupomFiscal({ pedido, catalogo });
		impressora.imprimirLinhas(cupom.gerarLinhas());
	}

	// B
	console.log("\n---CENÁRIO B (Regular + ETIC10)---");
	{
		const carrinho = new CarrinhoDeCompras({ catalogo, estoque });
		carrinho.adicionarItem("MICRO", 1);
		carrinho.adicionarItem("VASO", 1);

		const pedido = caixa.fecharCompra({
			cliente: clienteRegular,
			carrinho,
			cupomCodigo: "ETIC10",
			numeroDeParcelas: 5
		});

		pedido.pagar();
		relatorio.registrarPedido(pedido);

		const cupom = new CupomFiscal({ pedido, catalogo });
		impressora.imprimirLinhas(cupom.gerarLinhas());
	}

	//C with the invalid coupon
	console.log("\n---CENÁRIO C (Erro Cupom) ---");
	{
		const carrinho = new CarrinhoDeCompras({ catalogo, estoque });
		carrinho.adicionarItem("ARROZ", 1);

		try {
			caixa.fecharCompra({ cliente: clienteRegular, carrinho, cupomCodigo: "INVALIDO" });
		} catch (err) {
			console.log("(OK) Cupom inválido gerou erro:");
			console.log(String(err.message || err));
		}
	}

	// D insufficient inventory
	console.log("\n--- CENÁRIO D (erro Estoque) ---");
	{
		const carrinho = new CarrinhoDeCompras({ catalogo, estoque });
		try {
			carrinho.adicionarItem("MICRO", 999);
		} catch (err) {
			console.log("(OK) estoque insuficiente gerou erro:");
			console.log(String(err.message || err));
		}
	}

	// E (relatorio)
	console.log("\n--- CENÁRIO E (Relatórios) ---");
	{
		console.log("Total Arrecadado:", formatBRL(relatorio.totalArrecadado()));
		console.log("Total Impostos:", formatBRL(relatorio.totalImpostos()));
		console.log("Ranking de Produtos:", relatorio.rankingProdutosPorQuantidade());
	}
}

// leeaving it here to make it run
runDemo();